import { NextRequest } from "next/server";
import { validateToken, completeSigning } from "@/lib/services/signing";
import { completeSigningSchema } from "@/lib/validation/fields";
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
    completeSigningSchema.parse(body);

    const result = await completeSigning(documentId, recipientId, req);

    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
