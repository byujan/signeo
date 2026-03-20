"use client";

import type { Field, FieldType, Recipient } from "@/types";
import {
  PenLine,
  Type,
  Calendar,
  User,
  CheckSquare,
  Hash,
} from "lucide-react";

const FIELD_ICONS: Record<FieldType, React.ReactNode> = {
  signature: <PenLine className="h-3 w-3" />,
  initials: <Hash className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
  full_name: <User className="h-3 w-3" />,
  text: <Type className="h-3 w-3" />,
  checkbox: <CheckSquare className="h-3 w-3" />,
};

const RECIPIENT_COLORS = [
  { bg: "bg-blue-100/80 border-blue-400", text: "text-blue-700" },
  { bg: "bg-green-100/80 border-green-400", text: "text-green-700" },
  { bg: "bg-purple-100/80 border-purple-400", text: "text-purple-700" },
  { bg: "bg-orange-100/80 border-orange-400", text: "text-orange-700" },
  { bg: "bg-pink-100/80 border-pink-400", text: "text-pink-700" },
];

interface FieldOverlayProps {
  fields: Field[];
  recipients: Recipient[];
  currentPage: number;
  mode: "edit" | "sign";
  onFieldClick?: (field: Field) => void;
  onFieldMove?: (fieldId: string, x: number, y: number) => void;
  onRemoveField?: (fieldId: string) => void;
}

export function FieldOverlay({
  fields,
  recipients,
  currentPage,
  mode,
  onFieldClick,
  onRemoveField,
}: FieldOverlayProps) {
  const pageFields = fields.filter((f) => f.page === currentPage);

  function getRecipientColor(recipientId: string) {
    const idx = recipients.findIndex((r) => r.id === recipientId);
    return RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
  }

  function handleDragStart(e: React.DragEvent, field: Field) {
    if (mode !== "edit") return;
    e.dataTransfer.setData("fieldId", field.id);
    const rect = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.setData(
      "offsetX",
      String(e.clientX - rect.left)
    );
    e.dataTransfer.setData(
      "offsetY",
      String(e.clientY - rect.top)
    );
  }

  return (
    <>
      {pageFields.map((field) => {
        const colors = getRecipientColor(field.recipient_id);
        const recipient = recipients.find(
          (r) => r.id === field.recipient_id
        );

        return (
          <div
            key={field.id}
            draggable={mode === "edit"}
            onDragStart={(e) => handleDragStart(e, field)}
            onClick={() => onFieldClick?.(field)}
            className={`absolute border-2 rounded cursor-pointer transition-shadow hover:shadow-md ${colors.bg}`}
            style={{
              left: `${field.x}%`,
              top: `${field.y}%`,
              width: `${field.width}%`,
              height: `${field.height}%`,
            }}
          >
            <div
              className={`flex items-center gap-1 px-1 text-xs truncate h-full ${colors.text}`}
            >
              {FIELD_ICONS[field.type]}
              <span className="truncate">
                {field.type === "signature"
                  ? "Signature"
                  : field.type === "initials"
                  ? "Initials"
                  : field.type === "date"
                  ? "Date"
                  : field.type === "full_name"
                  ? "Name"
                  : field.type === "checkbox"
                  ? ""
                  : field.label || "Text"}
              </span>
              {mode === "edit" && recipient && (
                <span className="ml-auto text-[10px] opacity-60 truncate">
                  {recipient.name.split(" ")[0]}
                </span>
              )}
            </div>
            {mode === "edit" && onRemoveField && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveField(field.id);
                }}
                className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
              >
                &times;
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
