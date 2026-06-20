import { supabase } from "@/integrations/supabase/client";

/**
 * Duplicate a row in a public table. Fetches the source row, strips identity/
 * timestamp columns and any caller-specified keys, then inserts a copy with
 * the overrides applied. Returns the newly-inserted row.
 *
 * Usage:
 *   await duplicateRow("services", id, {
 *     overrides: { title: `${row.title} (copia)`, is_active: false, sort_order: list.length },
 *   });
 */
export async function duplicateRow<T extends Record<string, any>>(
  table: string,
  id: string,
  opts: {
    overrides?: Partial<T>;
    omit?: string[];
  } = {},
): Promise<T> {
  // Fetch source
  const { data, error } = await (supabase as any)
    .from(table)
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) throw error || new Error("Row not found");

  // Strip identity/timestamp columns and any caller-specified keys
  const strip = new Set(["id", "created_at", "updated_at", ...(opts.omit || [])]);
  const payload: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!strip.has(k)) payload[k] = v;
  }
  Object.assign(payload, opts.overrides || {});

  const { data: inserted, error: insErr } = await (supabase as any)
    .from(table)
    .insert(payload)
    .select()
    .single();
  if (insErr) throw insErr;
  return inserted as T;
}
