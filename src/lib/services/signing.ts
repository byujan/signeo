import {
  admin,
  adminInsert,
  adminSelectOne,
  adminSelectMany,
} from "@/lib/supabase/typed-admin";
import { hashToken, generateToken } from "@/lib/utils/tokens";
import { getClientInfo } from "@/lib/utils/request";
import { logEvent } from "./audit";
import { finalizePdf } from "./pdf";
import { sendCompletionNotice, sendSigningInvite } from "./email";
import { getSignedUrl } from "./storage";
import { AppError } from "@/lib/utils/errors";
import type { SigningSession, Field } from "@/types";

export async function validateToken(
  documentId: string,
  rawToken: string
): Promise<{ recipientId: string; tokenId: string }> {
  const hash = hashToken(rawToken);

  const { data: token } = await admin()
    .from("signing_tokens")
    .select()
    .eq("token_hash", hash)
    .single();

  const t = token as {
    id: string;
    recipient_id: string;
    expires_at: string;
    revoked: boolean;
  } | null;

  if (!t) throw new AppError("Invalid signing link", 403);
  if (t.revoked)
    throw new AppError("This signing link has been revoked", 403);
  if (new Date(t.expires_at) < new Date())
    throw new AppError("This signing link has expired", 403);

  // Verify recipient belongs to this document
  const recipient = await adminSelectOne(
    "recipients",
    "id",
    t.recipient_id
  );

  if (!recipient || recipient.document_id !== documentId) {
    throw new AppError("Invalid signing link", 403);
  }

  return { recipientId: t.recipient_id, tokenId: t.id };
}

export async function getSigningSession(
  documentId: string,
  recipientId: string,
  req: Request
): Promise<SigningSession> {
  const doc = await adminSelectOne("documents", "id", documentId);
  if (!doc) throw new AppError("Document not found", 404);

  if (["completed", "voided", "expired"].includes(doc.status)) {
    throw new AppError(`This document is ${doc.status}`, 403);
  }

  const recipient = await adminSelectOne("recipients", "id", recipientId);
  if (!recipient) throw new AppError("Recipient not found", 404);

  if (recipient.status === "signed") {
    throw new AppError("You have already signed this document", 403);
  }

  // Check signing order
  if (doc.signing_order_enabled) {
    const allRecipients = await adminSelectMany(
      "recipients",
      "document_id",
      documentId
    );
    const prior = allRecipients.filter(
      (r) =>
        r.role === "signer" &&
        r.signing_order < recipient.signing_order &&
        r.status !== "signed"
    );
    if (prior.length > 0) {
      throw new AppError("Waiting for previous signers to complete", 403);
    }
  }

  // Fetch only this recipient's fields
  const allFields = await adminSelectMany(
    "fields",
    "document_id",
    documentId
  );
  const myFields = allFields.filter(
    (f) => f.recipient_id === recipientId
  ) as Field[];

  // Generate signed URL for PDF
  const pdfUrl = await getSignedUrl(
    "documents",
    doc.original_storage_path!,
    600
  );

  // Update recipient status to viewed
  if (recipient.status === "pending" || recipient.status === "notified") {
    await admin()
      .from("recipients")
      .update({ status: "viewed" })
      .eq("id", recipientId);

    if (doc.status === "sent") {
      await admin()
        .from("documents")
        .update({ status: "viewed" })
        .eq("id", documentId);
    }
  }

  await logEvent(
    { documentId, recipientId, eventType: "signing.link_opened" },
    req
  );

  return {
    document: {
      id: doc.id,
      title: doc.title,
      status: doc.status as SigningSession["document"]["status"],
      signing_order_enabled: doc.signing_order_enabled,
    },
    recipient: {
      id: recipient.id,
      name: recipient.name,
      email: recipient.email,
      status: "viewed" as const,
      signing_order: recipient.signing_order,
    },
    fields: myFields,
    pdfUrl,
  };
}

export async function fillField(
  documentId: string,
  recipientId: string,
  fieldId: string,
  value: string,
  req: Request
): Promise<void> {
  const field = await adminSelectOne("fields", "id", fieldId);
  if (!field) throw new AppError("Field not found", 404);
  if (field.recipient_id !== recipientId || field.document_id !== documentId) {
    throw new AppError("Access denied", 403);
  }

  const recipient = await adminSelectOne("recipients", "id", recipientId);
  if (recipient?.status === "signed") {
    throw new AppError("Already signed — fields are locked", 403);
  }

  await admin()
    .from("fields")
    .update({ value, filled_at: new Date().toISOString() })
    .eq("id", fieldId);

  await logEvent(
    {
      documentId,
      recipientId,
      eventType: "signing.field_filled",
      metadata: { fieldId },
    },
    req
  );
}

export async function completeSigning(
  documentId: string,
  recipientId: string,
  req: Request
): Promise<{ allComplete: boolean }> {
  const recipient = await adminSelectOne("recipients", "id", recipientId);

  if (recipient?.status === "signed") {
    return { allComplete: false }; // idempotent
  }

  // Verify all required fields are filled
  const allFields = await adminSelectMany(
    "fields",
    "document_id",
    documentId
  );
  const myFields = allFields.filter((f) => f.recipient_id === recipientId);
  const emptyRequired = myFields.filter((f) => f.required && !f.value);

  if (emptyRequired.length > 0) {
    throw new AppError(
      `${emptyRequired.length} required field(s) must be completed`
    );
  }

  const { ip, userAgent } = getClientInfo(req);

  await logEvent(
    {
      documentId,
      recipientId,
      eventType: "signing.consent_given",
      metadata: { ip: ip ?? "unknown", userAgent: userAgent ?? "unknown" },
    },
    req
  );

  // Mark signed
  await admin()
    .from("recipients")
    .update({
      status: "signed",
      signed_at: new Date().toISOString(),
      ip_address: ip,
      user_agent: userAgent,
    })
    .eq("id", recipientId);

  await logEvent(
    { documentId, recipientId, eventType: "signing.completed" },
    req
  );

  // Check if all signers are done
  const allRecipients = await adminSelectMany(
    "recipients",
    "document_id",
    documentId
  );
  const signers = allRecipients.filter((r) => r.role === "signer");
  const allSigned = signers.every((r) =>
    r.id === recipientId ? true : r.status === "signed"
  );

  if (allSigned) {
    await finalizePdf(documentId, req);

    // Send completion email
    const doc = await adminSelectOne("documents", "id", documentId);
    if (doc) {
      const senderProfile = await adminSelectOne(
        "profiles",
        "id",
        doc.sender_id
      );
      if (senderProfile) {
        await sendCompletionNotice({
          to: senderProfile.email,
          senderName: senderProfile.full_name,
          documentTitle: doc.title,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
        });
      }
    }

    return { allComplete: true };
  }

  // Not all done — update document status
  await admin()
    .from("documents")
    .update({ status: "partially_signed" })
    .eq("id", documentId);

  // Notify next signer if signing order enabled
  const doc = await adminSelectOne("documents", "id", documentId);
  if (doc?.signing_order_enabled && recipient) {
    const nextSigner = signers.find(
      (r) =>
        r.signing_order > recipient.signing_order && r.status !== "signed"
    );

    if (nextSigner) {
      const { raw, hash } = generateToken();
      await adminInsert("signing_tokens", {
        recipient_id: nextSigner.id,
        token_hash: hash,
        expires_at: doc.expires_at!,
      });

      const senderProfile = await adminSelectOne(
        "profiles",
        "id",
        doc.sender_id
      );

      await sendSigningInvite({
        to: nextSigner.email,
        recipientName: nextSigner.name,
        documentTitle: doc.title,
        signingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign/${documentId}?token=${raw}`,
        senderName: senderProfile?.full_name ?? "Someone",
      });

      await admin()
        .from("recipients")
        .update({ status: "notified" })
        .eq("id", nextSigner.id);
    }
  }

  return { allComplete: false };
}
