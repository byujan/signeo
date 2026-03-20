"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, GripVertical } from "lucide-react";
import type { Recipient } from "@/types";

interface RecipientEditorProps {
  documentId: string;
  recipients: Recipient[];
  onUpdate: () => void;
}

export function RecipientEditor({
  documentId,
  recipients,
  onUpdate,
}: RecipientEditorProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);

  async function addRecipient(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role: "signer",
          signing_order: recipients.length + 1,
        }),
      });

      if (res.ok) {
        setName("");
        setEmail("");
        onUpdate();
      }
    } finally {
      setAdding(false);
    }
  }

  async function removeRecipient(recipientId: string) {
    await fetch(
      `/api/documents/${documentId}/recipients?rid=${recipientId}`,
      { method: "DELETE" }
    );
    onUpdate();
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Recipients</h3>

      {recipients.length > 0 && (
        <div className="space-y-2">
          {recipients.map((r, i) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {r.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{r.email}</p>
              </div>
              <button
                onClick={() => removeRecipient(r.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addRecipient} className="flex gap-2">
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" loading={adding}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
