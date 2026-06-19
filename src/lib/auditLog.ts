import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "bulk_delete"
  | "bulk_update"
  | "reorder"
  | "status_change"
  | "login"
  | "export";

/**
 * Registra una acción del panel admin en la tabla audit_log.
 * Falla silenciosamente para no interrumpir el flujo del usuario.
 */
export async function logAction(
  action: AuditAction | string,
  entity_type: string,
  entity_id?: string | null,
  details?: Record<string, unknown> | null,
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    await supabase.from("audit_log").insert({
      user_id: user.id,
      user_email: user.email ?? null,
      action,
      entity_type,
      entity_id: entity_id ?? null,
      details: (details ?? null) as never,
    });
  } catch (err) {
    console.warn("[auditLog] failed to log action", err);
  }
}
