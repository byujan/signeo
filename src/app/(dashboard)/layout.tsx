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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow focus:text-sm focus:font-medium focus:text-blue-600"
      >
        Skip to content
      </a>
      <DashboardNav
        userName={profile?.full_name ?? "User"}
        userEmail={profile?.email ?? user.email ?? ""}
      />
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
