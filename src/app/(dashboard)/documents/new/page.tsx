"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/documents/FileUpload";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NewDocumentPage() {
  const router = useRouter();
  usePageTitle("New Document — Signeo");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const doc = await res.json();
      router.push(`/documents/${doc.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        New Document
      </h1>

      <form onSubmit={handleCreate} className="space-y-6">
        <Input
          id="title"
          label="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Employment Agreement"
          required
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PDF File
          </label>
          <FileUpload file={file} onFileSelect={setFile} />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">{error}</p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!file || !title.trim()}
            loading={loading}
          >
            Upload &amp; Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
