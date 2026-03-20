import { admin, adminInsert, adminSelectMany } from "@/lib/supabase/typed-admin";
import { logEvent } from "./audit";
import { generateToken } from "@/lib/utils/tokens";
import { sendSigningInvite } from "./email";
import { uploadFile } from "./storage";
import { getPageCount } from "./pdf";
import type { Document, DocumentStatus, Recipient } from "@/types";
import { AppError } from "@/lib/utils/errors";

const VALID_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ["sent", "voided"],
  sent: ["viewed", "voided", "expired"],
  viewed: ["partially_signed", "completed", "voided", "expired"],
  partially_signed: ["completed", "voided", "expired"],
  completed: [],
  voided: [],
  expired: [],
};

export function canTransition(
  from: DocumentStatus,
  to: DocumentStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function computeDocumentStatus(
  recipients: Pick<Recipient, "status" | "role">[]
): DocumentStatus {
  const signers = recipients.filter((r) => r.role === "signer");
  const signedCount = signers.filter((r) => r.status === "signed").length;

  if (signedCount === signers.length) return "completed";
  if (signedCount > 0) return "partially_signed";
  if (signers.some((r) => r.status === "viewed")) return "viewed";
  return "sent";
}

export async function createDocument(
  senderId: string,
  orgId: string,
  title: string,
  pdfBytes: ArrayBuffer,
  req: Request
): Promise<Document> {
  const db = admin();

  const pageCount = await getPageCount(pdfBytes);

  // Create document row
  const doc = await adminInsert("documents", {
    sender_id: senderId,
    org_id: orgId,
    title,
    page_count: pageCount,
  });

  // Upload PDF
  const storagePath = `${orgId}/${doc.id}/original.pdf`;
  await uploadFile("documents", storagePath, pdfBytes, "application/pdf");

  // Update with storage path
  await db
    .from("documents")
    .update({ original_storage_path: storagePath })
    .eq("id", doc.id);

  await logEvent(
    {
      documentId: doc.id,
      actorId: senderId,
      eventType: "document.created",
    },
    req
  );

  return { ...doc, original_storage_path: storagePath } as Document;
}

export async function sendDocument(
  documentId: string,
  senderId: string,
  senderName: string,
  req: Request
): Promise<void> {
  const db = admin();

  // Verify document
  const { data: docData } = await db
    .from("documents")
    .select()
    .eq("id", documentId)
    .eq("sender_id", senderId)
    .eq("status", "draft")
    .single();

  const doc = docData as Document | null;
  if (!doc) throw new AppError("Document not found or not in draft status");

  // Verify recipients exist
  const recipients = await adminSelectMany(
    "recipients",
    "document_id",
    documentId
  );

  if (!recipients.length)
    throw new AppError("Add at least one recipient first");

  // Verify fields exist
  const fields = await adminSelectMany("fields", "document_id", documentId);
  if (!fields.length) throw new AppError("Place at least one field first");

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Sort recipients by signing_order
  recipients.sort((a, b) => a.signing_order - b.signing_order);

  // Generate tokens and send emails
  for (const recipient of recipients) {
    const { raw, hash } = generateToken();

    await adminInsert("signing_tokens", {
      recipient_id: recipient.id,
      token_hash: hash,
      expires_at: expiresAt,
    });

    const shouldNotify =
      !doc.signing_order_enabled || recipient.signing_order === 1;

    if (shouldNotify) {
      const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${documentId}?token=${raw}`;

      await sendSigningInvite({
        to: recipient.email,
        recipientName: recipient.name,
        documentTitle: doc.title,
        signingUrl,
        senderName,
      });

      await db
        .from("recipients")
        .update({ status: "notified" })
        .eq("id", recipient.id);

      await logEvent(
        {
          documentId,
          recipientId: recipient.id,
          actorId: senderId,
          eventType: "recipient.notified",
        },
        req
      );
    }
  }

  // Update document status
  await db
    .from("documents")
    .update({
      status: "sent",
      expires_at: expiresAt,
      sent_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  await logEvent(
    {
      documentId,
      actorId: senderId,
      eventType: "document.sent",
      metadata: { recipientCount: recipients.length },
    },
    req
  );
}

export async function voidDocument(
  documentId: string,
  senderId: string,
  req: Request
): Promise<void> {
  const db = admin();

  const { data: docData } = await db
    .from("documents")
    .select()
    .eq("id", documentId)
    .eq("sender_id", senderId)
    .single();

  const doc = docData as { status: string } | null;
  if (!doc) throw new AppError("Document not found", 404);
  if (!canTransition(doc.status as DocumentStatus, "voided")) {
    throw new AppError("Cannot void this document");
  }

  // Revoke all tokens
  const recipients = await adminSelectMany(
    "recipients",
    "document_id",
    documentId
  );

  if (recipients.length) {
    const recipientIds = recipients.map((r) => r.id);
    await db
      .from("signing_tokens")
      .update({ revoked: true })
      .in("recipient_id", recipientIds);
  }

  await db
    .from("documents")
    .update({ status: "voided" })
    .eq("id", documentId);

  await logEvent(
    {
      documentId,
      actorId: senderId,
      eventType: "document.voided",
    },
    req
  );
}
