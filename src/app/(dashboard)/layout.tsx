import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { queryProfile } from "@/lib/supabase/helpers";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await queryProfile(supabase, user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        userName={profile?.full_name ?? "User"}
        userEmail={profile?.email ?? user.email ?? ""}
      />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
