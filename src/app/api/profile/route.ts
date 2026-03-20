import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/services/auth";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { admin } from "@/lib/supabase/typed-admin";

export async function GET() {
  try {
    const { profile } = await requireAuth();
    return Response.json(profile);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const db = admin();

    const updates: Record<string, string> = {};

    if (typeof body.full_name === "string") {
      const name = body.full_name.trim();
      if (!name || name.length > 100) {
        throw new AppError("Name must be between 1 and 100 characters");
      }
      updates.full_name = name;
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields to update");
    }

    const { data, error } = await db
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new AppError("Failed to update profile");

    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
