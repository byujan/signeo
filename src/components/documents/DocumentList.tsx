"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import type { DocumentWithRecipients } from "@/types";
import {
  FileText,
  Users,
  Clock,
  ChevronRight,
} from "lucide-react";

export function DocumentList({
  documents,
}: {
  documents: DocumentWithRecipients[];
}) {
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
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
      {documents.map((doc) => {
        const signedCount = doc.recipients.filter(
          (r) => r.status === "signed"
        ).length;
        const totalSigners = doc.recipients.filter(
          (r) => r.role === "signer"
        ).length;

        return (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
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
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        );
      })}
    </div>
  );
}
