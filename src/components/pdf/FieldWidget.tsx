"use client";

import type { FieldType } from "@/types";
import {
  PenLine,
  Type,
  Calendar,
  User,
  CheckSquare,
  Hash,
} from "lucide-react";

interface FieldToolbarProps {
  onAddField: (type: FieldType) => void;
  selectedRecipientId: string | null;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] =
  [
    { type: "signature", label: "Signature", icon: <PenLine className="h-4 w-4" /> },
    { type: "initials", label: "Initials", icon: <Hash className="h-4 w-4" /> },
    { type: "date", label: "Date", icon: <Calendar className="h-4 w-4" /> },
    { type: "full_name", label: "Full Name", icon: <User className="h-4 w-4" /> },
    { type: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
    { type: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" /> },
  ];

export function FieldToolbar({
  onAddField,
  selectedRecipientId,
}: FieldToolbarProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Add Fields
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {FIELD_TYPES.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => onAddField(type)}
            disabled={!selectedRecipientId}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
      {!selectedRecipientId && (
        <p className="text-xs text-amber-600">
          Select a recipient first
        </p>
      )}
    </div>
  );
}
