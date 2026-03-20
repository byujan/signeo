import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { createDocument } from "@/lib/services/documents";
import { errorResponse } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
import { queryDocuments } from "@/lib/supabase/helpers";

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

    if (file.type !== "application/pdf") {
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
