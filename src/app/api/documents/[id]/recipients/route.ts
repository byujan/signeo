import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { addRecipientSchema } from "@/lib/validation/recipients";
import { logEvent } from "@/lib/services/audit";
import { errorResponse } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
import { queryDocument, queryRecipients } from "@/lib/supabase/helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth();

    const supabase = await createClient();
    const recipients = await queryRecipients(supabase, id);

    return Response.json(recipients);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await requireAuth();

    const body = await req.json();
    const parsed = addRecipientSchema.parse(body);

    const supabase = await createClient();
    const doc = await queryDocument(supabase, id);

    if (!doc || doc.sender_id !== userId)
      return Response.json({ error: "Document not found" }, { status: 404 });
    if (doc.status !== "draft")
      return Response.json(
        { error: "Can only add recipients to draft documents" },
        { status: 400 }
      );

    // Prevent duplicate email on the same document
    const existing = await queryRecipients(supabase, id);
    if (existing.some((r) => r.email.toLowerCase() === parsed.email.toLowerCase())) {
      return Response.json(
        { error: "This recipient has already been added to the document" },
        { status: 409 }
      );
    }

    const { data: recipientData, error } = await supabase
      .from("recipients")
      .insert({
        document_id: id,
        name: parsed.name,
        email: parsed.email,
        role: parsed.role,
        signing_order: parsed.signing_order,
      })
      .select()
      .single();

    if (error || !recipientData)
      return Response.json({ error: error?.message ?? "Insert failed" }, { status: 400 });

    const recipient = recipientData as { id: string; [key: string]: unknown };

    await logEvent(
      {
        documentId: id,
        recipientId: recipient.id,
        actorId: userId,
        eventType: "recipient.added",
      },
      req
    );

    return Response.json(recipient, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await requireAuth();
    const recipientId = req.nextUrl.searchParams.get("rid");

    if (!recipientId)
      return Response.json(
        { error: "rid query param required" },
        { status: 400 }
      );

    const supabase = await createClient();
    const doc = await queryDocument(supabase, id);

    if (!doc || doc.sender_id !== userId || doc.status !== "draft")
      return Response.json(
        { error: "Can only remove recipients from draft documents" },
        { status: 400 }
      );

    // Delete associated fields first
    await supabase
      .from("fields")
      .delete()
      .eq("document_id", id)
      .eq("recipient_id", recipientId);

    await supabase.from("recipients").delete().eq("id", recipientId);

    return Response.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
