import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { errorResponse } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
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
    await requireAuth();

    const supabase = await createClient();
    const doc = await queryDocument(supabase, id);

    if (!doc)
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
