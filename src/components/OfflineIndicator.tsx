import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, AlertTriangle, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { flushQueue, queueSize, conflictCount } from "@/lib/offlineQueue";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(queueSize());
  const [conflicts, setConflicts] = useState(conflictCount());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    const onChange = () => { setPending(queueSize()); setConflicts(conflictCount()); };
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    window.addEventListener("offline-queue-change", onChange);
    const t = setInterval(onChange, 5000);
    return () => {
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
      window.removeEventListener("offline-queue-change", onChange);
      clearInterval(t);
    };
  }, []);

  const sync = async () => {
    setSyncing(true);
    const { ok, fail, conflicts: c } = await flushQueue();
    setPending(queueSize());
    setConflicts(conflictCount());
    setSyncing(false);
    if (ok) toast.success(`${ok} cambio(s) sincronizados`);
    if (c) toast.warning(`${c} conflicto(s) requieren revisión`);
    if (fail) toast.warning(`${fail} pendiente(s)`);
    if (!ok && !fail && !c) toast.info("Nada por sincronizar");
  };

  if (online && pending === 0 && conflicts === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card text-sm">
      {!online ? (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span>Sin conexión</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 text-emerald-600" />
          <span className="text-muted-foreground">Online</span>
        </>
      )}
      {pending > 0 && (
        <>
          <span className="font-medium">{pending} pendiente{pending !== 1 ? "s" : ""}</span>
          <Button size="sm" variant="ghost" onClick={sync} disabled={syncing || !online}>
            <RefreshCw className={"h-3 w-3 " + (syncing ? "animate-spin" : "")} />
          </Button>
        </>
      )}
      {conflicts > 0 && (
        <Link to="/admin#offline-pending" className="flex items-center gap-1 text-amber-600 font-medium">
          <AlertTriangle className="h-3 w-3" /> {conflicts} conflicto{conflicts !== 1 ? "s" : ""}
        </Link>
      )}
    </div>
  );
}
