"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowLeft, User, Lock, Mail } from "lucide-react";
import type { Profile } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  usePageTitle("Profile — Signeo");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFullName(data.full_name);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        toast("success", "Profile updated");
        router.refresh();
      } else {
        const data = await res.json();
        toast("error", data.error || "Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast("error", "Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        toast("success", "Password changed");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        toast("error", data.error || "Failed to change password");
      }
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-pulse">
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  const isDirty = fullName.trim() !== profile.full_name;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-medium text-gray-900">Personal Information</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            id="full-name"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
            </div>
            <p className="text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 px-3 py-2">
              {profile.email}
            </p>
            <p className="text-xs text-gray-500">
              Email cannot be changed
            </p>
          </div>

          <div className="text-xs text-gray-500">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-medium text-gray-900">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            id="new-password"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            id="confirm-new-password"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={changingPassword}
              disabled={!newPassword || !confirmPassword}
            >
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
