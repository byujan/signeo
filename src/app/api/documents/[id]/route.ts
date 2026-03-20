import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/typed-admin";
import {
  queryDocument,
  queryRecipients,
  queryAuditEvents,
} from "@/lib/supabase/helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { profile } = await requireAuth();

    const supabase = await createClient();
    const doc = await queryDocument(supabase, id);

    if (!doc || doc.org_id !== profile.org_id)
      return Response.json({ error: "Not found" }, { status: 404 });

    const [recipients, auditEvents] = await Promise.all([
      queryRecipients(supabase, id),
      queryAuditEvents(supabase, id),
    ]);

    return Response.json({
      ...doc,
      recipients,
      audit_events: auditEvents,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await requireAuth();
    const body = await req.json();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("documents")
      .update({
        ...(body.title && { title: body.title }),
        ...(body.signing_order_enabled !== undefined && {
          signing_order_enabled: body.signing_order_enabled,
        }),
      })
      .eq("id", id)
      .eq("sender_id", userId)
      .eq("status", "draft")
      .select()
      .single();

    if (error)
      return Response.json({ error: "Update failed" }, { status: 400 });

    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await requireAuth();

    const db = admin();

    // Verify ownership and only allow deleting draft/voided docs
    const { data: doc } = await db
      .from("documents")
      .select("id, status, sender_id")
      .eq("id", id)
      .eq("sender_id", userId)
      .single();

    if (!doc) throw new AppError("Document not found", 404);

    if (!["draft", "voided"].includes(doc.status)) {
      throw new AppError("Only draft or voided documents can be deleted");
    }

    // Delete in order: audit_events, fields, signing_tokens (via recipients), recipients, document
    await db.from("audit_events").delete().eq("document_id", id);
    await db.from("fields").delete().eq("document_id", id);

    const { data: recipients } = await db
      .from("recipients")
      .select("id")
      .eq("document_id", id);

    if (recipients?.length) {
      const rids = recipients.map((r) => r.id);
      await db.from("signing_tokens").delete().in("recipient_id", rids);
    }

    await db.from("recipients").delete().eq("document_id", id);
    await db.from("documents").delete().eq("id", id);

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
