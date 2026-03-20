"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { FieldOverlay } from "@/components/pdf/FieldOverlay";
import { FieldToolbar } from "@/components/pdf/FieldWidget";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { Field, FieldType, Recipient, Document } from "@/types";
import { ArrowLeft, Save } from "lucide-react";

const DEFAULT_FIELD_SIZES: Record<FieldType, { width: number; height: number }> = {
  signature: { width: 20, height: 5 },
  initials: { width: 10, height: 5 },
  date: { width: 15, height: 3 },
  full_name: { width: 20, height: 3 },
  text: { width: 20, height: 3 },
  checkbox: { width: 3, height: 3 },
};

export default function PreparePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [doc, setDoc] = useState<Document | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);

  usePageTitle(doc ? `Place Fields — Signeo` : "Signeo");

  const fetchData = useCallback(async () => {
    const [docRes, recipientsRes, fieldsRes, downloadRes] = await Promise.all([
      fetch(`/api/documents/${id}`),
      fetch(`/api/documents/${id}/recipients`),
      fetch(`/api/documents/${id}/fields`),
      fetch(`/api/documents/${id}/download`),
    ]);

    if (docRes.ok) setDoc(await docRes.json());
    if (recipientsRes.ok) {
      const r = await recipientsRes.json();
      setRecipients(r);
      if (r.length > 0 && !selectedRecipientId) {
        setSelectedRecipientId(r[0].id);
      }
    }
    if (fieldsRes.ok) setFields(await fieldsRes.json());
    if (downloadRes.ok) {
      const { url } = await downloadRes.json();
      setPdfUrl(url);
    }
  }, [id, selectedRecipientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Warn on beforeunload when dirty
  useEffect(() => {
    if (!dirty) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  function handleBack() {
    if (dirty) {
      setBackConfirmOpen(true);
    } else {
      router.push(`/documents/${id}`);
    }
  }

  function addField(type: FieldType) {
    if (!selectedRecipientId) return;
    const size = DEFAULT_FIELD_SIZES[type];

    const newField: Field = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      document_id: id,
      recipient_id: selectedRecipientId,
      type,
      page: currentPage,
      x: 30,
      y: 40,
      width: size.width,
      height: size.height,
      required: true,
      label: null,
      value: null,
      filled_at: null,
      created_at: new Date().toISOString(),
    };

    setFields((prev) => [...prev, newField]);
    setDirty(true);
  }

  function removeField(fieldId: string) {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    setDirty(true);
  }

  function handleFieldMove(fieldId: string, x: number, y: number) {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, x, y } : f))
    );
    setDirty(true);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const fieldId = e.dataTransfer.getData("fieldId");
    if (!fieldId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = parseFloat(e.dataTransfer.getData("offsetX")) || 0;
    const offsetY = parseFloat(e.dataTransfer.getData("offsetY")) || 0;

    const x = ((e.clientX - rect.left - offsetX) / rect.width) * 100;
    const y = ((e.clientY - rect.top - offsetY) / rect.height) * 100;

    handleFieldMove(fieldId, Math.max(0, Math.min(95, x)), Math.max(0, Math.min(95, y)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const fieldPayload = fields.map((f) => ({
        recipient_id: f.recipient_id,
        type: f.type,
        page: f.page,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        required: f.required,
        label: f.label,
      }));

      const res = await fetch(`/api/documents/${id}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: fieldPayload }),
      });

      if (res.ok) {
        const savedFields = await res.json();
        setFields(savedFields);
        setDirty(false);
        toast("success", "Fields saved");
      } else {
        const data = await res.json();
        toast("error", data.error || "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!doc || !pdfUrl) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
            <div className="h-6 w-48 bg-gray-200 rounded" />
          </div>
          <div className="h-9 w-28 bg-gray-200 rounded" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 space-y-4">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
          <div className="flex-1 h-[600px] bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to document
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Place Fields &mdash; {doc.title}
          </h1>
        </div>
        <Button onClick={handleSave} loading={saving} disabled={!dirty}>
          <Save className="h-4 w-4 mr-1" />
          Save Fields
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 lg:flex-shrink-0 space-y-6">
          {/* Recipient selector */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Assign to
            </h3>
            {recipients.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRecipientId(r.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                  selectedRecipientId === r.id
                    ? "border-blue-400 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {r.name}
                <span className="block text-xs opacity-60">{r.email}</span>
              </button>
            ))}
            {recipients.length === 0 && (
              <p className="text-xs text-amber-600">
                Add recipients on the document page first.
              </p>
            )}
          </div>

          <FieldToolbar
            onAddField={addField}
            selectedRecipientId={selectedRecipientId}
          />

          {/* Field count */}
          <div className="text-xs text-gray-500">
            {fields.length} field{fields.length !== 1 ? "s" : ""} placed
            {dirty && (
              <span className="text-amber-600 ml-1">(unsaved changes)</span>
            )}
          </div>
        </div>

        {/* PDF + fields */}
        <div
          className="flex-1"
          ref={containerRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <PdfViewer
            url={pdfUrl}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            overlay={
              <FieldOverlay
                fields={fields}
                recipients={recipients}
                currentPage={currentPage}
                mode="edit"
                onRemoveField={removeField}
                onFieldMove={handleFieldMove}
              />
            }
          />
        </div>
      </div>

      {/* Unsaved changes confirm */}
      <ConfirmDialog
        open={backConfirmOpen}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave?"
        confirmLabel="Leave"
        variant="danger"
        onConfirm={() => router.push(`/documents/${id}`)}
        onCancel={() => setBackConfirmOpen(false)}
      />
    </div>
  );
}
