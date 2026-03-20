import { NextRequest } from "next/server";
import { validateToken } from "@/lib/services/signing";
import { uploadAndGetPath } from "@/lib/services/storage";
import { errorResponse } from "@/lib/utils/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return Response.json({ error: "Token required" }, { status: 401 });
    }

    const { recipientId } = await validateToken(documentId, token);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "signature" or "initials"

    if (!file) {
      return Response.json({ error: "File required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const ext = file.type === "image/jpeg" ? "jpg" : "png";
    const filename = type === "initials" ? `initials.${ext}` : `signature.${ext}`;
    const storagePath = `${documentId}/${recipientId}/${filename}`;

    await uploadAndGetPath("signatures", storagePath, bytes, file.type);

    return Response.json({ path: storagePath });
  } catch (err) {
    return errorResponse(err);
  }
}
