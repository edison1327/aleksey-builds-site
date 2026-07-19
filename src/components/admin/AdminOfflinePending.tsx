import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Play, WifiOff, Wifi } from "lucide-react";
import { listQueue, removeOp, retryNow, flushQueue, clearQueue, type QueueOp } from "@/lib/offlineQueue";
import { toast } from "sonner";

export default function AdminOfflinePending() {
  const [items, setItems] = useState<QueueOp[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [busy, setBusy] = useState(false);

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
    const { ok, fail } = await flushQueue();
    setBusy(false);
    refresh();
    if (ok) toast.success(`${ok} sincronizados`);
    if (fail) toast.warning(`${fail} pendientes (reintentando con backoff)`);
    if (!ok && !fail) toast.info("Nada por sincronizar");
  };

  const wipe = () => {
    if (!confirm("¿Descartar TODOS los cambios pendientes? Esta acción no se puede deshacer.")) return;
    clearQueue();
    refresh();
    toast.success("Cola vaciada");
  };

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleString() : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Pendientes offline</h2>
          <p className="text-sm text-muted-foreground">Cambios guardados localmente que aún no se enviaron al servidor.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={online ? "default" : "destructive"} className="gap-1">
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? "Online" : "Offline"}
          </Badge>
          <Button size="sm" variant="outline" onClick={syncAll} disabled={busy || !online}>
            <RefreshCw className={"h-4 w-4 mr-1 " + (busy ? "animate-spin" : "")} /> Sincronizar
          </Button>
          <Button size="sm" variant="destructive" onClick={wipe} disabled={!items.length}>
            <Trash2 className="h-4 w-4 mr-1" /> Vaciar
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay cambios pendientes. Todo sincronizado ✓
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((op) => {
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
