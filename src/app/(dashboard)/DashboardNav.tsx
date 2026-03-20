"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <Link
          href="/dashboard"
          className="text-lg font-bold text-gray-900"
        >
          Signeo
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/documents/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Document
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hidden sm:inline">{userName}</span>
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
