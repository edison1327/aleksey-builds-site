import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { flushQueue, queueSize } from "@/lib/offlineQueue";
import { toast } from "sonner";

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(queueSize());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    const onChange = () => setPending(queueSize());
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
    const { ok, fail } = await flushQueue();
    setPending(queueSize());
    setSyncing(false);
    if (ok) toast.success(`${ok} cambio(s) sincronizados`);
    if (fail) toast.warning(`${fail} pendiente(s)`);
    if (!ok && !fail) toast.info("Nada por sincronizar");
  };

  if (online && pending === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card text-sm">
      {!online ? (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span>Sin conexión</span>
        </>
      ) : (
        <span className="text-muted-foreground">Online</span>
      )}
      {pending > 0 && (
        <>
          <span className="font-medium">{pending} pendiente{pending !== 1 ? "s" : ""}</span>
          <Button size="sm" variant="ghost" onClick={sync} disabled={syncing || !online}>
            <RefreshCw className={"h-3 w-3 " + (syncing ? "animate-spin" : "")} />
          </Button>
        </>
      )}
    </div>
  );
}
