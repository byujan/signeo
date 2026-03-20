import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { createDocument } from "@/lib/services/documents";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/typed-admin";
import { queryDocuments } from "@/lib/supabase/helpers";
import { isPdfFile, isWordFile } from "@/lib/services/convert";

export async function GET() {
  try {
    const { profile } = await requireAuth();
    const supabase = await createClient();
    const documents = await queryDocuments(supabase, profile.org_id);
    return Response.json(documents);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, profile } = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file || !title) {
      return Response.json(
        { error: "file and title are required" },
        { status: 400 }
      );
    }

    if (isWordFile(file.type)) {
      return Response.json(
        { error: "Please upload a PDF. Word document conversion is not supported." },
        { status: 400 }
      );
    }

    if (!isPdfFile(file.type)) {
      return Response.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { error: "File must be under 10MB" },
        { status: 400 }
      );
    }

    const pdfBytes = await file.arrayBuffer();

    const doc = await createDocument(
      userId,
      profile.org_id,
      title,
      pdfBytes,
      req
    );

    return Response.json(doc, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError("Provide an array of document IDs");
    }

    if (ids.length > 50) {
      throw new AppError("Cannot delete more than 50 documents at once");
    }

    const db = admin();

    // Verify ownership and deletability
    const { data: docs } = await db
      .from("documents")
      .select("id, status")
      .in("id", ids)
      .eq("sender_id", userId);

    if (!docs?.length) throw new AppError("No documents found", 404);

    const deletable = docs.filter((d) =>
      ["draft", "voided"].includes(d.status)
    );

    if (deletable.length === 0) {
      throw new AppError("None of the selected documents can be deleted. Only draft or voided documents can be deleted.");
    }

    const deleteIds = deletable.map((d) => d.id);

    // Delete related data
    await db.from("audit_events").delete().in("document_id", deleteIds);
    await db.from("fields").delete().in("document_id", deleteIds);

    const { data: recipients } = await db
      .from("recipients")
      .select("id")
      .in("document_id", deleteIds);

    if (recipients?.length) {
      const rids = recipients.map((r) => r.id);
      await db.from("signing_tokens").delete().in("recipient_id", rids);
    }

    await db.from("recipients").delete().in("document_id", deleteIds);
    await db.from("documents").delete().in("id", deleteIds);

    const skipped = ids.length - deletable.length;
    return Response.json({
      deleted: deletable.length,
      skipped,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
