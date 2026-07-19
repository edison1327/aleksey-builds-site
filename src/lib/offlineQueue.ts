import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const KEY = "aleksey.offline.queue.v1";
const MAX_ATTEMPTS = 6;
// Exponential backoff: 5s, 15s, 45s, 2m, 6m, 18m
const BACKOFF_MS = [5_000, 15_000, 45_000, 120_000, 360_000, 1_080_000];

export type QueueOp = {
  id: string;
  table: string;
  action: "insert" | "update" | "delete";
  payload?: Record<string, unknown>;
  match?: Record<string, unknown>;
  label: string;
  createdAt: string;
  attempts?: number;
  nextRetryAt?: string; // ISO
  lastError?: string;
  // Conflict detection: expected server updated_at at time of enqueue
  expectedUpdatedAt?: string;
  // Conflict state
  status?: "pending" | "conflict";
  serverSnapshot?: Record<string, unknown>;
};

function read(): QueueOp[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: QueueOp[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("offline-queue-change"));
}

export function queueSize(): number { return read().length; }
export function conflictCount(): number { return read().filter(o => o.status === "conflict").length; }
export function listQueue(): QueueOp[] { return read(); }

export function enqueue(op: Omit<QueueOp, "id" | "createdAt" | "attempts" | "nextRetryAt" | "status">) {
  const items = read();
  items.push({
    ...op,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
    nextRetryAt: new Date().toISOString(),
    status: "pending",
  });
  write(items);
}

export function removeOp(id: string) {
  write(read().filter((o) => o.id !== id));
}

export function retryNow(id: string) {
  const items = read().map((o) =>
    o.id === id ? { ...o, nextRetryAt: new Date().toISOString(), attempts: 0, lastError: undefined, status: "pending" as const } : o,
  );
  write(items);
  void flushQueue();
}

// Resolve a conflict: "local" = force push our payload, "server" = discard local change
export async function resolveConflict(id: string, strategy: "local" | "server") {
  const items = read();
  const op = items.find(o => o.id === id);
  if (!op) return;
  if (strategy === "server") {
    removeOp(id);
    toast.info("Cambio local descartado, se conservó la versión del servidor");
    return;
  }
  // Local wins: clear expectedUpdatedAt so update proceeds unconditionally
  write(items.map(o => o.id === id
    ? { ...o, expectedUpdatedAt: undefined, status: "pending" as const, attempts: 0, nextRetryAt: new Date().toISOString(), lastError: undefined, serverSnapshot: undefined }
    : o));
  void flushQueue();
}

export function clearQueue() { write([]); }

async function runOp(op: QueueOp): Promise<{ conflict?: { snapshot: Record<string, unknown> } }> {
  const t: any = supabase.from(op.table as any);

  // Conflict check for updates when we have baseline
  if (op.action === "update" && op.expectedUpdatedAt && op.match) {
    let q = supabase.from(op.table as any).select("*");
    for (const [k, v] of Object.entries(op.match)) q = q.eq(k, v as any);
    const { data, error } = await q.maybeSingle();
    if (!error && data && (data as any).updated_at && (data as any).updated_at !== op.expectedUpdatedAt) {
      return { conflict: { snapshot: data as any } };
    }
  }

  let res;
  if (op.action === "insert") res = await t.insert(op.payload);
  else if (op.action === "update") {
    let q = t.update(op.payload);
    for (const [k, v] of Object.entries(op.match || {})) q = q.eq(k, v);
    res = await q;
  } else {
    let q = t.delete();
    for (const [k, v] of Object.entries(op.match || {})) q = q.eq(k, v);
    res = await q;
  }
  if (res.error) throw res.error;
  return {};
}

export async function flushQueue(): Promise<{ ok: number; fail: number; skipped: number; conflicts: number }> {
  if (!navigator.onLine) return { ok: 0, fail: 0, skipped: 0, conflicts: 0 };
  const items = read();
  if (!items.length) return { ok: 0, fail: 0, skipped: 0, conflicts: 0 };
  const now = Date.now();
  let ok = 0, fail = 0, skipped = 0, conflicts = 0;
  const remaining: QueueOp[] = [];
  for (const op of items) {
    if (op.status === "conflict") { remaining.push(op); skipped++; continue; }
    const retryAt = op.nextRetryAt ? Date.parse(op.nextRetryAt) : 0;
    if (retryAt > now) { remaining.push(op); skipped++; continue; }
    try {
      const result = await runOp(op);
      if (result.conflict) {
        conflicts++;
        remaining.push({ ...op, status: "conflict", serverSnapshot: result.conflict.snapshot, lastError: "Conflicto: el registro fue modificado en el servidor" });
      } else {
        ok++;
      }
    } catch (e: any) {
      const attempts = (op.attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        fail++;
        remaining.push({ ...op, attempts, lastError: e?.message || String(e), nextRetryAt: undefined });
      } else {
        const delay = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
        remaining.push({
          ...op,
          attempts,
          lastError: e?.message || String(e),
          nextRetryAt: new Date(now + delay).toISOString(),
        });
        fail++;
      }
    }
  }
  write(remaining);
  return { ok, fail, skipped, conflicts };
}

let started = false;
let timer: number | undefined;
export function initOfflineSync() {
  if (started) return;
  started = true;
  const run = async () => {
    const { ok, fail, conflicts } = await flushQueue();
    if (ok) toast.success(`Sincronizados ${ok} cambio(s) pendientes`);
    if (conflicts) toast.warning(`${conflicts} conflicto(s) requieren revisión`);
    if (fail) toast.warning(`${fail} cambio(s) reintentarán con backoff`);
  };
  window.addEventListener("online", run);
  window.addEventListener("offline", () => toast.info("Sin conexión: los cambios se guardarán localmente"));
  timer = window.setInterval(() => { if (navigator.onLine && queueSize()) void flushQueue(); }, 10_000);
  if (navigator.onLine) void run();
}
