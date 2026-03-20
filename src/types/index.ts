// ── Enums ──────────────────────────────────────────────

export type DocumentStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partially_signed"
  | "completed"
  | "voided"
  | "expired";

export type RecipientStatus =
  | "pending"
  | "notified"
  | "viewed"
  | "signed"
  | "declined";

export type RecipientRole = "signer" | "viewer";

export type FieldType =
  | "signature"
  | "initials"
  | "date"
  | "full_name"
  | "text"
  | "checkbox";

export type AuditEventType =
  | "document.created"
  | "document.updated"
  | "document.sent"
  | "document.viewed"
  | "document.voided"
  | "document.expired"
  | "document.completed"
  | "recipient.added"
  | "recipient.removed"
  | "recipient.notified"
  | "recipient.reminded"
  | "signing.link_opened"
  | "signing.consent_given"
  | "signing.field_filled"
  | "signing.completed"
  | "signing.declined"
  | "pdf.finalized"
  | "pdf.downloaded";

// ── Entities ───────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Document {
  id: string;
  org_id: string;
  sender_id: string;
  title: string;
  status: DocumentStatus;
  original_storage_path: string | null;
  signed_storage_path: string | null;
  signed_pdf_hash: string | null;
  page_count: number | null;
  signing_order_enabled: boolean;
  expires_at: string | null;
  sent_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recipient {
  id: string;
  document_id: string;
  name: string;
  email: string;
  role: RecipientRole;
  signing_order: number;
  status: RecipientStatus;
  signed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Field {
  id: string;
  document_id: string;
  recipient_id: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  label: string | null;
  value: string | null;
  filled_at: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  document_id: string;
  recipient_id: string | null;
  actor_id: string | null;
  event_type: AuditEventType;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── API Types ──────────────────────────────────────────

export interface SigningSession {
  document: Pick<
    Document,
    "id" | "title" | "status" | "signing_order_enabled"
  >;
  recipient: Pick<
    Recipient,
    "id" | "name" | "email" | "status" | "signing_order"
  >;
  fields: Field[];
  pdfUrl: string;
}

export interface DocumentWithRecipients extends Document {
  recipients: Recipient[];
}

export interface FieldPlacement {
  id?: string;
  recipient_id: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  label?: string;
}
