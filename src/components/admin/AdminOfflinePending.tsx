import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Play, WifiOff, Wifi, AlertTriangle, Server, Smartphone } from "lucide-react";
import { listQueue, removeOp, retryNow, flushQueue, clearQueue, resolveConflict, type QueueOp } from "@/lib/offlineQueue";
import { toast } from "sonner";

export default function AdminOfflinePending() {
  const [items, setItems] = useState<QueueOp[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = () => setItems(listQueue());

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener("offline-queue-change", onChange);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    const t = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener("offline-queue-change", onChange);
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
      clearInterval(t);
    };
  }, []);

  const syncAll = async () => {
    setBusy(true);
    const { ok, fail, conflicts } = await flushQueue();
    setBusy(false);
    refresh();
    if (ok) toast.success(`${ok} sincronizados`);
    if (conflicts) toast.warning(`${conflicts} conflicto(s) requieren revisión`);
    if (fail) toast.warning(`${fail} pendientes (reintentando)`);
    if (!ok && !fail && !conflicts) toast.info("Nada por sincronizar");
  };

  const wipe = () => {
    if (!confirm("¿Descartar TODOS los cambios pendientes? Esta acción no se puede deshacer.")) return;
    clearQueue();
    refresh();
    toast.success("Cola vaciada");
  };

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleString() : "—";

  const conflictItems = items.filter(o => o.status === "conflict");
  const pendingItems = items.filter(o => o.status !== "conflict");

  const renderPayload = (obj?: Record<string, unknown>) => {
    if (!obj) return <span className="text-muted-foreground">—</span>;
    const entries = Object.entries(obj).filter(([k]) => !["id", "created_at", "updated_at"].includes(k)).slice(0, 8);
    return (
      <div className="space-y-0.5 font-mono">
        {entries.map(([k, v]) => (
          <div key={k} className="truncate">
            <span className="text-muted-foreground">{k}:</span>{" "}
            <span>{typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Pendientes offline</h2>
          <p className="text-sm text-muted-foreground">Cambios locales aún no enviados. Los conflictos se resuelven manualmente.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={online ? "default" : "destructive"} className="gap-1">
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? "Online" : "Offline"}
          </Badge>
          {conflictItems.length > 0 && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
              <AlertTriangle className="h-3 w-3" /> {conflictItems.length} conflicto{conflictItems.length !== 1 ? "s" : ""}
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={syncAll} disabled={busy || !online}>
            <RefreshCw className={"h-4 w-4 mr-1 " + (busy ? "animate-spin" : "")} /> Sincronizar
          </Button>
          <Button size="sm" variant="destructive" onClick={wipe} disabled={!items.length}>
            <Trash2 className="h-4 w-4 mr-1" /> Vaciar
          </Button>
        </div>
      </div>

      {conflictItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" /> Conflictos a resolver
          </h3>
          {conflictItems.map((op) => {
            const isOpen = expanded === op.id;
            return (
              <Card key={op.id} className="p-3 border-amber-500/40 bg-amber-500/5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{op.action}</Badge>
                      <Badge variant="secondary">{op.table}</Badge>
                      <Badge variant="outline" className="text-amber-600 border-amber-600">Conflicto</Badge>
                    </div>
                    <div className="mt-1 text-sm font-medium">{op.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{op.lastError}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : op.id)}>
                    {isOpen ? "Ocultar" : "Comparar"}
                  </Button>
                </div>
                {isOpen && (
                  <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-md border border-border p-2 bg-background">
                      <div className="flex items-center gap-1 mb-2 font-semibold">
                        <Smartphone className="h-3 w-3" /> Tu versión (local)
                      </div>
                      {renderPayload(op.payload)}
                    </div>
                    <div className="rounded-md border border-border p-2 bg-background">
                      <div className="flex items-center gap-1 mb-2 font-semibold">
                        <Server className="h-3 w-3" /> Versión del servidor
                      </div>
                      {renderPayload(op.serverSnapshot)}
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => resolveConflict(op.id, "local")}>
                    <Smartphone className="h-4 w-4 mr-1" /> Mantener local
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolveConflict(op.id, "server")}>
                    <Server className="h-4 w-4 mr-1" /> Mantener servidor
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {pendingItems.length === 0 && conflictItems.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay cambios pendientes. Todo sincronizado ✓
        </Card>
      ) : (
        <div className="space-y-2">
          {pendingItems.map((op) => {
            const stuck = (op.attempts || 0) >= 6;
            return (
              <Card key={op.id} className="p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{op.action}</Badge>
                      <Badge variant="secondary">{op.table}</Badge>
                      {stuck && <Badge variant="destructive">Detenido</Badge>}
                      {op.attempts ? <Badge variant="outline">Intentos: {op.attempts}</Badge> : null}
                    </div>
                    <div className="mt-1 text-sm font-medium truncate">{op.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Creado: {fmt(op.createdAt)} · Próximo intento: {fmt(op.nextRetryAt)}
                    </div>
                    {op.lastError && (
                      <div className="mt-1 text-xs text-destructive break-words">{op.lastError}</div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => { retryNow(op.id); refresh(); }} disabled={!online}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { removeOp(op.id); refresh(); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
