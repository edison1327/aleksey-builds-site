import { supabase } from "@/integrations/supabase/client";

export type Severity = "info" | "warning" | "error" | "fatal";

interface LogErrorInput {
  message: string;
  stack?: string;
  severity?: Severity;
  context?: Record<string, unknown>;
}

/**
 * Fire-and-forget logger to the `error_log` table.
 * Safe to call from anywhere in the client; failures are swallowed so
 * the logger never surfaces its own errors.
 */
export async function logError({
  message,
  stack,
  severity = "error",
  context,
}: LogErrorInput) {
  try {
    const { data: { user } = { user: null } } = await supabase.auth.getUser();
    await supabase.from("error_log").insert({
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 8000) ?? null,
      url: typeof window !== "undefined" ? window.location.href : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      user_id: user?.id ?? null,
      severity,
      context: (context as any) ?? null,
    });
  } catch {
    // Never let the logger break the app
  }
}

/**
 * Install global handlers to capture unhandled errors and promise rejections.
 * Call once at app bootstrap.
 */
export function installGlobalErrorHandlers() {
  if (typeof window === "undefined") return;
  if ((window as any).__aleksey_errors_installed) return;
  (window as any).__aleksey_errors_installed = true;

  window.addEventListener("error", (e) => {
    logError({
      message: e.message || "window.onerror",
      stack: e.error?.stack,
      severity: "error",
      context: { source: "window.onerror", filename: e.filename, lineno: e.lineno },
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason: any = e.reason;
    logError({
      message: typeof reason === "string" ? reason : reason?.message || "Unhandled rejection",
      stack: reason?.stack,
      severity: "error",
      context: { source: "unhandledrejection" },
    });
  });
}
