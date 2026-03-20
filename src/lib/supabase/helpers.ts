import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Helper type to extract Row type from a table name
type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

// Typed query helpers that work around PostgREST type inference limitations
export async function queryProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<TableRow<"profiles"> | null> {
  const { data } = await supabase
    .from("profiles")
    .select()
    .eq("id", userId)
    .single();
  return data as TableRow<"profiles"> | null;
}

export async function queryDocuments(
  supabase: SupabaseClient<Database>,
  orgId: string
): Promise<TableRow<"documents">[]> {
  const { data } = await supabase
    .from("documents")
    .select()
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  return (data ?? []) as TableRow<"documents">[];
}

export async function queryDocument(
  supabase: SupabaseClient<Database>,
  docId: string
): Promise<TableRow<"documents"> | null> {
  const { data } = await supabase
    .from("documents")
    .select()
    .eq("id", docId)
    .single();
  return data as TableRow<"documents"> | null;
}

export async function queryRecipients(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<TableRow<"recipients">[]> {
  const { data } = await supabase
    .from("recipients")
    .select()
    .eq("document_id", documentId)
    .order("signing_order");
  return (data ?? []) as TableRow<"recipients">[];
}

export async function queryRecipientsForDocs(
  supabase: SupabaseClient<Database>,
  docIds: string[]
): Promise<TableRow<"recipients">[]> {
  if (docIds.length === 0) return [];
  const { data } = await supabase
    .from("recipients")
    .select()
    .in("document_id", docIds);
  return (data ?? []) as TableRow<"recipients">[];
}

export async function queryFields(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<TableRow<"fields">[]> {
  const { data } = await supabase
    .from("fields")
    .select()
    .eq("document_id", documentId)
    .order("page")
    .order("y");
  return (data ?? []) as TableRow<"fields">[];
}

export async function queryAuditEvents(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<TableRow<"audit_events">[]> {
  const { data } = await supabase
    .from("audit_events")
    .select()
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });
  return (data ?? []) as TableRow<"audit_events">[];
}
