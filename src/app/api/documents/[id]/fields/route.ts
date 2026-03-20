import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { batchFieldsSchema } from "@/lib/validation/fields";
import { errorResponse } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
import { queryDocument, queryFields } from "@/lib/supabase/helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth();

    const supabase = await createClient();
    const fields = await queryFields(supabase, id);

    return Response.json(fields);
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT = batch replace all fields for a document
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await requireAuth();

    const body = await req.json();
    const parsed = batchFieldsSchema.parse(body);

    const supabase = await createClient();
    const doc = await queryDocument(supabase, id);

    if (!doc || doc.sender_id !== userId)
      return Response.json({ error: "Document not found" }, { status: 404 });
    if (doc.status !== "draft")
      return Response.json(
        { error: "Can only edit fields on draft documents" },
        { status: 400 }
      );

    // Delete existing fields and insert new ones
    await supabase.from("fields").delete().eq("document_id", id);

    const fieldsToInsert = parsed.fields.map((f) => ({
      document_id: id,
      recipient_id: f.recipient_id,
      type: f.type,
      page: f.page,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      required: f.required,
      label: f.label ?? null,
    }));

    const { data: fields, error } = await supabase
      .from("fields")
      .insert(fieldsToInsert)
      .select();

    if (error)
      return Response.json({ error: error.message }, { status: 400 });

    return Response.json(fields);
  } catch (err) {
    return errorResponse(err);
  }
}
