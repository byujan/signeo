"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Plus, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function DashboardNav({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard">
          <Logo />
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/documents/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Document
            </Button>
          </Link>

          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              title="Profile settings"
            >
              <UserCircle className="h-5 w-5 text-gray-400" />
              <span className="hidden sm:inline">{userName}</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
              title={`Sign out (${userEmail})`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
