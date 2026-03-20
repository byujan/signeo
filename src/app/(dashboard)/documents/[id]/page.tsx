"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { RecipientEditor } from "@/components/documents/RecipientEditor";
import type { Document, Recipient, AuditEvent } from "@/types";
import {
  Download,
  Send,
  Ban,
  ArrowLeft,
  Settings,
  Clock,
} from "lucide-react";

interface DocDetail extends Document {
  recipients: Recipient[];
  audit_events: AuditEvent[];
}

export default function DocumentDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const fetchDoc = useCallback(async () => {
    const res = await fetch(`/api/documents/${id}`);
    if (res.ok) {
      setDoc(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  async function handleSend() {
    setActionLoading("send");
    try {
      const res = await fetch(`/api/documents/${id}/send`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }
      fetchDoc();
    } finally {
      setActionLoading("");
    }
  }

  async function handleVoid() {
    if (!confirm("Void this document? All signing links will be revoked."))
      return;
    setActionLoading("void");
    try {
      await fetch(`/api/documents/${id}/void`, { method: "POST" });
      fetchDoc();
    } finally {
      setActionLoading("");
    }
  }

  async function handleDownload() {
    const res = await fetch(`/api/documents/${id}/download`);
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, "_blank");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Document not found</p>
      </div>
    );
  }

  const isDraft = doc.status === "draft";
  const isTerminal = ["completed", "voided", "expired"].includes(doc.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {doc.title}
            </h1>
            <StatusBadge status={doc.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Created {new Date(doc.created_at).toLocaleString()} &middot;{" "}
            {doc.page_count} page{doc.page_count !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <>
              <Link href={`/documents/${id}/prepare`}>
                <Button variant="secondary" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Place Fields
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={handleSend}
                loading={actionLoading === "send"}
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </>
          )}
          {!isDraft && !isTerminal && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleVoid}
              loading={actionLoading === "void"}
            >
              <Ban className="h-4 w-4 mr-1" />
              Void
            </Button>
          )}
          {doc.original_storage_path && (
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              {doc.status === "completed" ? "Download Signed" : "Download PDF"}
            </Button>
          )}
        </div>
      </div>

      {/* Recipients */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {isDraft ? (
          <RecipientEditor
            documentId={id}
            recipients={doc.recipients}
            onUpdate={fetchDoc}
          />
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Recipients</h3>
            {doc.recipients.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.signed_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(r.signed_at).toLocaleString()}
                    </span>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Trail */}
      {doc.audit_events.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Activity Log
          </h3>
          <div className="space-y-2">
            {doc.audit_events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 text-sm"
              >
                <Clock className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700">
                    {formatEventType(event.event_type)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.created_at).toLocaleString()}
                    {event.ip_address && ` from ${event.ip_address}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatEventType(type: string): string {
  const labels: Record<string, string> = {
    "document.created": "Document created",
    "document.sent": "Document sent for signing",
    "document.viewed": "Document viewed",
    "document.voided": "Document voided",
    "document.completed": "All signatures completed",
    "recipient.added": "Recipient added",
    "recipient.removed": "Recipient removed",
    "recipient.notified": "Signing invite sent",
    "signing.link_opened": "Signing link opened",
    "signing.consent_given": "E-sign consent accepted",
    "signing.field_filled": "Field filled",
    "signing.completed": "Signer completed",
    "pdf.finalized": "Signed PDF generated",
    "pdf.downloaded": "PDF downloaded",
  };
  return labels[type] ?? type;
}
