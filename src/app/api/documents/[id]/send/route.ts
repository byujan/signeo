import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { sendDocument } from "@/lib/services/documents";
import { errorResponse } from "@/lib/utils/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, profile } = await requireAuth();

    await sendDocument(id, userId, profile.full_name, req);

    return Response.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
