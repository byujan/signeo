import { NextRequest } from "next/server";
import { validateToken, fillField } from "@/lib/services/signing";
import { fillFieldSchema } from "@/lib/validation/fields";
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

    const body = await req.json();
    const parsed = fillFieldSchema.parse(body);

    await fillField(documentId, recipientId, parsed.field_id, parsed.value, req);

    return Response.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
