import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { AppError } from "@/lib/utils/errors";

export async function requireAuth(): Promise<{
  userId: string;
  profile: Profile;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new AppError("Unauthorized", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) throw new AppError("Profile not found", 404);

  return { userId: user.id, profile: profile as Profile };
}
