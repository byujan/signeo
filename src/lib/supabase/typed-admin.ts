// Typed wrappers for admin client operations.
// The service-role client bypasses RLS. These helpers provide typed returns
// while working around PostgREST type inference limitations.

import { createAdminClient } from "./admin";
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;
type Row<T extends TableName> = Tables[T]["Row"];

// Re-export the raw admin client for direct use with .from().update() etc.
export function admin() {
  return createAdminClient();
}

// For typed insert + select + single
export async function adminInsert<T extends TableName>(
  table: T,
  values: Tables[T]["Insert"]
): Promise<Row<T>> {
  const client = createAdminClient();
  // Use the typed .from() for the specific table
  const { data, error } = await (client as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) throw new Error(`Insert into ${String(table)} failed: ${error.message}`);
  return data as Row<T>;
}

// For typed select single by column
export async function adminSelectOne<T extends TableName>(
  table: T,
  column: string,
  value: string
): Promise<Row<T> | null> {
  const client = createAdminClient();
  const { data } = await (client as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .from(table)
    .select()
    .eq(column, value)
    .single();

  return (data ?? null) as Row<T> | null;
}

// For typed select many by column
export async function adminSelectMany<T extends TableName>(
  table: T,
  column: string,
  value: string
): Promise<Row<T>[]> {
  const client = createAdminClient();
  const { data } = await (client as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .from(table)
    .select()
    .eq(column, value);

  return (data ?? []) as Row<T>[];
}
