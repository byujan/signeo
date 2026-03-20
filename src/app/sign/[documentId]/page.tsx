"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { SignaturePad } from "@/components/signing/SignaturePad";
import { ConsentBanner } from "@/components/signing/ConsentBanner";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { SigningSession, Field, FieldType } from "@/types";
import {
  PenLine,
  Calendar,
  User,
  CheckSquare,
  Hash,
  Type,
  Check,
  Loader2,
} from "lucide-react";

const FIELD_ICONS: Record<FieldType, React.ReactNode> = {
  signature: <PenLine className="h-3 w-3" />,
  initials: <Hash className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
  full_name: <User className="h-3 w-3" />,
  text: <Type className="h-3 w-3" />,
  checkbox: <CheckSquare className="h-3 w-3" />,
};

export default function SigningPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [session, setSession] = useState<SigningSession | null>(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [fields, setFields] = useState<Field[]>([]);
  const [sigPadOpen, setSigPadOpen] = useState(false);
  const [sigPadFieldId, setSigPadFieldId] = useState<string | null>(null);
  const [sigPadType, setSigPadType] = useState<"signature" | "initials">(
    "signature"
  );
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  usePageTitle(
    session ? `Sign ${session.document.title} — Signeo` : "Signeo"
  );

  const fetchSession = useCallback(async () => {
    if (!token) {
      setError("No signing token provided");
      return;
    }

    try {
      const res = await fetch(
        `/api/signing/${documentId}?token=${encodeURIComponent(token)}`
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid or expired link");
        return;
      }

      const data: SigningSession = await res.json();
      setSession(data);
      setFields(data.fields);
    } catch {
      setError("Unable to load. Please check your connection and try again.");
    }
  }, [documentId, token]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  async function saveFieldValue(fieldId: string, value: string) {
    // Optimistic update — keep previous state for rollback
    const previousFields = fields;
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? { ...f, value, filled_at: new Date().toISOString() }
          : f
      )
    );

    try {
      // Save to server
      const res = await fetch(
        `/api/signing/${documentId}/fields?token=${encodeURIComponent(token!)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field_id: fieldId, value }),
        }
      );

      if (!res.ok) {
        setFields(previousFields);
        toast("error", "Failed to save field value");
      }
    } catch {
      setFields(previousFields);
      toast("error", "Network error. Please try again.");
    }
  }

  async function handleSignatureCapture(dataUrl: string) {
    if (!sigPadFieldId) return;

    try {
      // Convert data URL to blob and upload
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("file", blob, "signature.png");
      formData.append("type", sigPadType);

      const uploadRes = await fetch(
        `/api/signing/${documentId}/signature?token=${encodeURIComponent(token!)}`,
        { method: "POST", body: formData }
      );

      if (uploadRes.ok) {
        const { path } = await uploadRes.json();
        await saveFieldValue(sigPadFieldId, path);
      } else {
        toast("error", "Failed to upload signature");
      }
    } catch {
      toast("error", "Network error. Please try again.");
    }

    setSigPadOpen(false);
    setSigPadFieldId(null);
  }

  function handleFieldClick(field: Field) {
    if (field.type === "signature" || field.type === "initials") {
      setSigPadFieldId(field.id);
      setSigPadType(field.type);
      setSigPadOpen(true);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch(
        `/api/signing/${documentId}/complete?token=${encodeURIComponent(token!)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consent: true }),
        }
      );

      if (res.ok) {
        setCompleted(true);
      } else {
        const data = await res.json();
        toast("error", data.error || "Failed to complete signing");
      }
    } finally {
      setCompleting(false);
    }
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to sign
          </h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Completed state
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Signing complete
          </h1>
          <p className="text-sm text-gray-500">
            Thank you, {session.recipient.name}. Your signature has been
            recorded for &ldquo;{session.document.title}&rdquo;. You may now close this window.
          </p>
        </div>
      </div>
    );
  }

  const requiredFields = fields.filter((f) => f.required);
  const filledRequired = requiredFields.filter((f) => f.value);
  const allRequiredFilled = filledRequired.length === requiredFields.length;

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              {session.document.title}
            </h1>
            <p className="text-xs text-gray-500">
              Signing as {session.recipient.name}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              {filledRequired.length}/{requiredFields.length} required fields
            </span>
            {allRequiredFilled && (
              <StatusBadge status="signed" className="text-xs" />
            )}
          </div>
        </div>
      </header>

      {/* PDF with fields */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PdfViewer
          url={session.pdfUrl}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          overlay={
            <>
              {fields
                .filter((f) => f.page === currentPage)
                .map((field) => (
                  <SigningField
                    key={field.id}
                    field={field}
                    recipientName={session.recipient.name}
                    onClick={() => handleFieldClick(field)}
                    onValueChange={(value) => saveFieldValue(field.id, value)}
                  />
                ))}
            </>
          }
        />
      </div>

      {/* Signature pad modal */}
      <Modal
        open={sigPadOpen}
        onClose={() => setSigPadOpen(false)}
        title={sigPadType === "initials" ? "Add Initials" : "Add Signature"}
      >
        <SignaturePad
          type={sigPadType}
          onSave={handleSignatureCapture}
          onCancel={() => setSigPadOpen(false)}
        />
      </Modal>

      {/* Consent banner */}
      {allRequiredFilled && (
        <ConsentBanner
          recipientName={session.recipient.name}
          onAccept={handleComplete}
          loading={completing}
        />
      )}
    </div>
  );
}

// Individual signing field component
function SigningField({
  field,
  recipientName,
  onClick,
  onValueChange,
}: {
  field: Field;
  recipientName: string;
  onClick: () => void;
  onValueChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(field.value || "");

  const isFilled = !!field.value;
  const baseCls = "absolute border-2 rounded transition-all";
  const filledCls = isFilled
    ? "border-green-400 bg-green-50/80"
    : "border-blue-400 bg-blue-50/80 hover:bg-blue-100/80 animate-pulse";

  const fieldStyle = {
    left: `${field.x}%`,
    top: `${field.y}%`,
    width: `${field.width}%`,
    height: `${field.height}%`,
  };

  // For signature/initials, show image if filled, otherwise prompt
  if (field.type === "signature" || field.type === "initials") {
    return (
      <button
        type="button"
        className={`${baseCls} ${filledCls} cursor-pointer appearance-none text-left`}
        style={fieldStyle}
        onClick={onClick}
      >
        {isFilled ? (
          <div className="flex items-center justify-center h-full text-green-600 text-xs">
            <Check className="h-4 w-4 mr-1" />
            {field.type === "initials" ? "Initials" : "Signed"}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 h-full text-blue-600 text-xs">
            {FIELD_ICONS[field.type]}
            Click to {field.type === "initials" ? "initial" : "sign"}
          </div>
        )}
      </button>
    );
  }

  // Checkbox
  if (field.type === "checkbox") {
    return (
      <button
        type="button"
        className={`${baseCls} ${filledCls} flex items-center justify-center cursor-pointer appearance-none`}
        style={fieldStyle}
        onClick={() => onValueChange(field.value === "true" ? "false" : "true")}
      >
        {field.value === "true" && (
          <Check className="h-4 w-4 text-green-600" />
        )}
      </button>
    );
  }

  // Date field — auto-fill with today's date
  if (field.type === "date") {
    const today = new Date().toLocaleDateString();
    return (
      <button
        type="button"
        className={`${baseCls} ${filledCls} cursor-pointer appearance-none text-left`}
        style={fieldStyle}
        onClick={() => {
          if (!isFilled) onValueChange(today);
        }}
      >
        <div className="flex items-center h-full px-1 text-xs">
          {isFilled ? (
            <span className="text-gray-900">{field.value}</span>
          ) : (
            <span className="text-blue-600">Click to add date</span>
          )}
        </div>
      </button>
    );
  }

  // Full name — auto-fill from session recipient name
  if (field.type === "full_name") {
    return (
      <button
        type="button"
        className={`${baseCls} ${filledCls} cursor-pointer appearance-none text-left`}
        style={fieldStyle}
        onClick={() => {
          if (!isFilled) onValueChange(recipientName);
        }}
      >
        <div className="flex items-center h-full px-1 text-xs">
          {isFilled ? (
            <span className="text-gray-900">{field.value}</span>
          ) : (
            <span className="text-blue-600">Click to add name</span>
          )}
        </div>
      </button>
    );
  }

  // Text field — inline editing
  if (editing) {
    return (
      <div
        className={`${baseCls} border-blue-500 bg-white`}
        style={fieldStyle}
      >
        <input
          type="text"
          className="w-full h-full px-1 text-xs text-gray-900 bg-transparent outline-none"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (inputValue.trim()) {
              onValueChange(inputValue.trim());
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditing(false);
              if (inputValue.trim()) {
                onValueChange(inputValue.trim());
              }
            } else if (e.key === "Escape") {
              setEditing(false);
              setInputValue(field.value || "");
            }
          }}
          autoFocus
          placeholder={field.label || "Enter text"}
        />
      </div>
    );
  }

  return (
    <div
      className={`${baseCls} ${filledCls} cursor-pointer`}
      style={fieldStyle}
      onClick={() => {
        setInputValue(field.value || "");
        setEditing(true);
      }}
    >
      <div className="flex items-center h-full px-1 text-xs">
        {isFilled ? (
          <span className="text-gray-900">{field.value}</span>
        ) : (
          <span className="text-blue-600">
            {field.label || "Click to enter text"}
          </span>
        )}
      </div>
    </div>
  );
}
