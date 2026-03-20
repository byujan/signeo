import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      throw new AppError("Password must be at least 8 characters");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new AppError(error.message);

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
