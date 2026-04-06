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

    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: "Signature file must be under 2MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    // Validate image magic bytes
    const header = new Uint8Array(bytes.slice(0, 8));
    const isPng =
      header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
    const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;

    if (!isPng && !isJpeg) {
      return Response.json({ error: "Only PNG and JPEG images are accepted" }, { status: 400 });
    }

    const ext = isJpeg ? "jpg" : "png";
    const filename = type === "initials" ? `initials.${ext}` : `signature.${ext}`;
    const storagePath = `${documentId}/${recipientId}/${filename}`;

    await uploadAndGetPath("signatures", storagePath, bytes, file.type);

    return Response.json({ path: storagePath });
  } catch (err) {
    return errorResponse(err);
  }
}
