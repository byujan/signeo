"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { DocumentWithRecipients } from "@/types";
import {
  FileText,
  Users,
  Clock,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";

export function DocumentList({
  documents,
}: {
  documents: DocumentWithRecipients[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === documents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(documents.map((d) => d.id)));
    }
  }

  function exitEditMode() {
    setEditMode(false);
    setSelected(new Set());
  }

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast("error", data.error || "Failed to delete documents");
        return;
      }

      const { deleted, skipped } = await res.json();
      if (skipped > 0) {
        toast(
          "info",
          `Deleted ${deleted} document${deleted !== 1 ? "s" : ""}. ${skipped} skipped (only draft/voided can be deleted).`
        );
      } else {
        toast("success", `Deleted ${deleted} document${deleted !== 1 ? "s" : ""}`);
      }
      exitEditMode();
      router.refresh();
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No documents yet
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Upload a PDF to get started.
        </p>
        <Link
          href="/documents/new"
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Document
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button
                onClick={toggleAll}
                className="text-xs text-blue-600 hover:underline"
              >
                {selected.size === documents.length
                  ? "Deselect all"
                  : "Select all"}
              </button>
              <span className="text-xs text-gray-500">
                {selected.size} selected
              </span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button
                variant="danger"
                size="sm"
                disabled={selected.size === 0}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete ({selected.size})
              </Button>
              <Button variant="secondary" size="sm" onClick={exitEditMode}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {documents.map((doc) => {
          const signedCount = doc.recipients.filter(
            (r) => r.status === "signed"
          ).length;
          const totalSigners = doc.recipients.filter(
            (r) => r.role === "signer"
          ).length;
          const isSelected = selected.has(doc.id);

          const content = (
            <div className="flex items-center gap-4 p-4">
              {editMode && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(doc.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.title}
                  </p>
                  <StatusBadge status={doc.status} />
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {signedCount}/{totalSigners} signed
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {!editMode && (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          );

          if (editMode) {
            return (
              <div
                key={doc.id}
                onClick={() => toggleSelect(doc.id)}
                className={`cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="block hover:bg-gray-50 transition-colors"
            >
              {content}
            </Link>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Documents"
        message={`Permanently delete ${selected.size} document${selected.size !== 1 ? "s" : ""}? Only draft and voided documents will be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        loading={deleting}
      />
    </div>
  );
}
