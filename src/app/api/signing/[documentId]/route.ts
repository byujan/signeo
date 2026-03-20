import { NextRequest } from "next/server";
import { validateToken, getSigningSession } from "@/lib/services/signing";
import { errorResponse } from "@/lib/utils/errors";

export async function GET(
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
    const session = await getSigningSession(documentId, recipientId, req);

    return Response.json(session);
  } catch (err) {
    return errorResponse(err);
  }
}
