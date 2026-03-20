import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { getSignedUrl } from "@/lib/services/storage";
import { logEvent } from "@/lib/services/audit";
import { errorResponse } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
import { queryDocument } from "@/lib/supabase/helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, profile } = await requireAuth();

    const supabase = await createClient();
    const doc = await queryDocument(supabase, id);

    if (!doc || doc.org_id !== profile.org_id)
      return Response.json({ error: "Not found" }, { status: 404 });

    const path =
      doc.status === "completed" && doc.signed_storage_path
        ? doc.signed_storage_path
        : doc.original_storage_path;

    if (!path) {
      return Response.json({ error: "No PDF available" }, { status: 404 });
    }

    const url = await getSignedUrl("documents", path, 300);

    // Only log audit event for explicit user downloads, not viewer prefetches
    const isViewerFetch = req.nextUrl.searchParams.get("viewer") === "1";
    if (!isViewerFetch) {
      await logEvent(
        {
          documentId: id,
          actorId: userId,
          eventType: "pdf.downloaded",
        },
        req
      );
    }

    return Response.json({
      url,
      type: doc.status === "completed" ? "signed" : "original",
    });
  } catch (err) {
    return errorResponse(err);
  }
}
