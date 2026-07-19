import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const KEY = "aleksey.offline.queue.v1";

export type QueueOp = {
  id: string;
  table: string;
  action: "insert" | "update" | "delete";
  payload?: Record<string, unknown>;
  match?: Record<string, unknown>;
  label: string;
  createdAt: string;
};

function read(): QueueOp[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: QueueOp[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("offline-queue-change"));
}

export function queueSize(): number { return read().length; }

export function enqueue(op: Omit<QueueOp, "id" | "createdAt">) {
  const items = read();
  items.push({ ...op, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  write(items);
}

export function clearQueue() { write([]); }

export async function flushQueue(): Promise<{ ok: number; fail: number }> {
  if (!navigator.onLine) return { ok: 0, fail: 0 };
  const items = read();
  if (!items.length) return { ok: 0, fail: 0 };
  let ok = 0, fail = 0;
  const remaining: QueueOp[] = [];
  for (const op of items) {
    try {
      const t: any = supabase.from(op.table as any);
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
      ok++;
    } catch (e) {
      fail++;
      remaining.push(op);
    }
  }
  write(remaining);
  return { ok, fail };
}

let started = false;
export function initOfflineSync() {
  if (started) return;
  started = true;
  const run = async () => {
    const { ok, fail } = await flushQueue();
    if (ok) toast.success(`Sincronizados ${ok} cambio(s) pendientes`);
    if (fail) toast.warning(`${fail} cambio(s) siguen pendientes`);
  };
  window.addEventListener("online", run);
  window.addEventListener("offline", () => toast.info("Sin conexión: los cambios se guardarán localmente"));
  if (navigator.onLine) void run();
}
