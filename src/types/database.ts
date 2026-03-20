// Supabase Database type definitions
// In production, generate these with: npx supabase gen types typescript
// For now, we define them manually to match our schema.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          org_id: string;
          full_name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          org_id: string;
          full_name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          full_name?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          org_id: string;
          sender_id: string;
          title: string;
          status: string;
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
        };
        Insert: {
          id?: string;
          org_id: string;
          sender_id: string;
          title: string;
          status?: string;
          original_storage_path?: string | null;
          signed_storage_path?: string | null;
          signed_pdf_hash?: string | null;
          page_count?: number | null;
          signing_order_enabled?: boolean;
          expires_at?: string | null;
          sent_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          sender_id?: string;
          title?: string;
          status?: string;
          original_storage_path?: string | null;
          signed_storage_path?: string | null;
          signed_pdf_hash?: string | null;
          page_count?: number | null;
          signing_order_enabled?: boolean;
          expires_at?: string | null;
          sent_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recipients: {
        Row: {
          id: string;
          document_id: string;
          name: string;
          email: string;
          role: string;
          signing_order: number;
          status: string;
          signed_at: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          name: string;
          email: string;
          role?: string;
          signing_order?: number;
          status?: string;
          signed_at?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          name?: string;
          email?: string;
          role?: string;
          signing_order?: number;
          status?: string;
          signed_at?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipients_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      signing_tokens: {
        Row: {
          id: string;
          recipient_id: string;
          token_hash: string;
          expires_at: string;
          revoked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          token_hash: string;
          expires_at: string;
          revoked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          token_hash?: string;
          expires_at?: string;
          revoked?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "signing_tokens_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "recipients";
            referencedColumns: ["id"];
          },
        ];
      };
      fields: {
        Row: {
          id: string;
          document_id: string;
          recipient_id: string;
          type: string;
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
        };
        Insert: {
          id?: string;
          document_id: string;
          recipient_id: string;
          type: string;
          page: number;
          x: number;
          y: number;
          width: number;
          height: number;
          required?: boolean;
          label?: string | null;
          value?: string | null;
          filled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          recipient_id?: string;
          type?: string;
          page?: number;
          x?: number;
          y?: number;
          width?: number;
          height?: number;
          required?: boolean;
          label?: string | null;
          value?: string | null;
          filled_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fields_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fields_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "recipients";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_events: {
        Row: {
          id: string;
          document_id: string;
          recipient_id: string | null;
          actor_id: string | null;
          event_type: string;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          recipient_id?: string | null;
          actor_id?: string | null;
          event_type: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          recipient_id?: string | null;
          actor_id?: string | null;
          event_type?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_events_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "recipients";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
