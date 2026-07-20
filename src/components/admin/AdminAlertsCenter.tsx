import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle, Package, ClipboardCheck, FileText, FileSignature,
  Handshake, FolderLock, Briefcase, RefreshCw, ExternalLink, Bell,
} from "lucide-react";
import { toast } from "sonner";

type Severity = "critical" | "warning" | "info";
type AlertItem = {
  id: string;
  severity: Severity;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  actionTab?: string;
  meta?: string;
};

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

const SEV_STYLES: Record<Severity, string> = {
  critical: "border-l-4 border-l-destructive bg-destructive/5",
  warning: "border-l-4 border-l-amber-500 bg-amber-500/5",
  info: "border-l-4 border-l-primary bg-primary/5",
};

const SEV_LABEL: Record<Severity, string> = {
  critical: "Crítico",
  warning: "Atención",
  info: "Info",
};

const daysUntil = (dateStr: string | null | undefined) => {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  return Math.floor((d.getTime() - Date.now()) / 86400000);
};

const goToTab = (tab: string) => {
  window.location.hash = tab;
  window.dispatchEvent(new HashChangeEvent("hashchange"));
};

export default function AdminAlertsCenter() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Severity>("all");

  const load = async () => {
    setLoading(true);
    const items: AlertItem[] = [];
    const safe = async <T,>(p: PromiseLike<T>): Promise<T | null> => {
      try { return await p; } catch { return null; }
    };

    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const [
      stock, wos, ovInv, expContracts, pendEvals, expDocs, pendApps, newMsgs,
    ] = await Promise.all([
      safe(supabase.from("stock_items").select("id,name,quantity,min_quantity").limit(200)),
      safe(supabase.from("work_orders").select("id,code,scheduled_date,status").in("status", ["pending", "in_progress"]).lt("scheduled_date", today).limit(50)),
      safe(supabase.from("invoices").select("id,code,customer_name,total,due_date,status").neq("status", "paid").lt("due_date", today).limit(50)),
      safe(supabase.from("contracts").select("id,code,title,customer_name").eq("status", "signed").limit(100)),
      safe(supabase.from("supplier_evaluations").select("id,supplier_id,status").eq("status", "pending").limit(50)),
      safe(supabase.from("documents").select("id,title,expires_at").not("expires_at", "is", null).lte("expires_at", in30).limit(50)),
      safe(supabase.from("job_applications").select("id,full_name,position_id").eq("status", "pending").limit(50)),
      safe(supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new")),
    ]);

    // Stock bajo
    for (const s of ((stock as any)?.data ?? []) as any[]) {
      const min = Number(s.min_quantity ?? 0);
      const qty = Number(s.quantity ?? 0);
      if (min > 0 && qty <= min) {
        const sev: Severity = qty === 0 ? "critical" : "warning";
        items.push({
          id: `stock-${s.id}`, severity: sev, category: "Inventario",
          icon: Package,
          title: qty === 0 ? `Sin stock: ${s.name}` : `Stock bajo: ${s.name}`,
          detail: `Disponible ${qty} · mínimo ${min}`,
          actionTab: "inventory",
        });
      }
    }

    // OTs vencidas
    for (const w of ((wos as any)?.data ?? []) as any[]) {
      const dLate = -daysUntil(w.scheduled_date);
      items.push({
        id: `wo-${w.id}`, severity: dLate > 7 ? "critical" : "warning",
        category: "Órdenes de trabajo", icon: ClipboardCheck,
        title: `OT vencida ${w.code ?? w.id.slice(0, 8)}`,
        detail: `${dLate} día(s) atrasada · estado ${w.status}`,
        actionTab: "workorders",
      });
    }

    // Facturas vencidas
    for (const inv of ((ovInv as any)?.data ?? []) as any[]) {
      const dLate = -daysUntil(inv.due_date);
      items.push({
        id: `inv-${inv.id}`, severity: dLate > 30 ? "critical" : "warning",
        category: "Facturación", icon: FileText,
        title: `Factura vencida ${inv.code ?? ""}`,
        detail: `${inv.customer_name ?? "Cliente"} · ${Number(inv.total || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" })} · ${dLate}d atraso`,
        actionTab: "invoices",
      });
    }

    // Contratos por vencer (si tuviera end_date se filtraría; usamos signed sin fecha)
    // Placeholder: solo mostrar count si hay muchos
    const signedCount = ((expContracts as any)?.data ?? []).length;
    if (signedCount >= 10) {
      items.push({
        id: `contracts-review`, severity: "info", category: "Contratos", icon: FileSignature,
        title: `${signedCount} contratos activos`,
        detail: "Revisa cuáles requieren renovación o cierre.",
        actionTab: "contracts",
      });
    }

    // Evaluaciones proveedor pendientes
    const evPend = ((pendEvals as any)?.data ?? []).length;
    if (evPend > 0) {
      items.push({
        id: "evals-pending", severity: evPend > 5 ? "warning" : "info",
        category: "Proveedores", icon: Handshake,
        title: `${evPend} evaluaciones de proveedor pendientes`,
        detail: "Cierra el ciclo de compras evaluando el desempeño.",
        actionTab: "suppliers",
      });
    }

    // Documentos por vencer
    for (const d of ((expDocs as any)?.data ?? []) as any[]) {
      const dLeft = daysUntil(d.expires_at);
      items.push({
        id: `doc-${d.id}`,
        severity: dLeft < 0 ? "critical" : dLeft <= 7 ? "warning" : "info",
        category: "Documentos", icon: FolderLock,
        title: dLeft < 0 ? `Documento vencido: ${d.title}` : `Vence en ${dLeft}d: ${d.title}`,
        detail: `Fecha: ${d.expires_at}`,
        actionTab: "documents",
      });
    }

    // Postulaciones pendientes
    const apps = ((pendApps as any)?.data ?? []).length;
    if (apps > 0) {
      items.push({
        id: "apps-pending", severity: apps > 10 ? "warning" : "info",
        category: "RRHH", icon: Briefcase,
        title: `${apps} postulaciones sin revisar`,
        detail: "Responde antes de 48h para mejor conversión.",
        actionTab: "applications",
      });
    }

    // Mensajes nuevos
    const mCount = (newMsgs as any)?.count ?? 0;
    if (mCount > 0) {
      items.push({
        id: "msgs-new", severity: mCount > 20 ? "warning" : "info",
        category: "Comunicación", icon: Bell,
        title: `${mCount} mensajes nuevos en bandeja`,
        detail: "Contesta antes de 24h para mantener SLA.",
        actionTab: "messages",
      });
    }

    items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    setAlerts(items);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all: alerts.length,
    critical: alerts.filter(a => a.severity === "critical").length,
    warning: alerts.filter(a => a.severity === "warning").length,
    info: alerts.filter(a => a.severity === "info").length,
  }), [alerts]);

  const visible = filter === "all" ? alerts : alerts.filter(a => a.severity === filter);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Centro de alertas
          </CardTitle>
          <CardDescription>
            Alertas críticas de toda la operación priorizadas y accionables.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total" value={counts.all} tone="muted" />
          <StatCard label="Críticos" value={counts.critical} tone="destructive" />
          <StatCard label="Atención" value={counts.warning} tone="amber" />
          <StatCard label="Info" value={counts.info} tone="primary" />
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Todas ({counts.all})</TabsTrigger>
            <TabsTrigger value="critical">Críticas ({counts.critical})</TabsTrigger>
            <TabsTrigger value="warning">Atención ({counts.warning})</TabsTrigger>
            <TabsTrigger value="info">Info ({counts.info})</TabsTrigger>
          </TabsList>
          <TabsContent value={filter} className="mt-4">
            <ScrollArea className="h-[600px] pr-2">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Cargando alertas...</p>
              ) : visible.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin alertas en esta categoría. ¡Todo en orden!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visible.map((a) => {
                    const Icon = a.icon;
                    return (
                      <div
                        key={a.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${SEV_STYLES[a.severity]}`}
                      >
                        <div className="p-2 rounded-md bg-background shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{SEV_LABEL[a.severity]}</Badge>
                            <span className="text-xs text-muted-foreground">{a.category}</span>
                          </div>
                          <p className="font-medium text-sm mt-1">{a.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                        </div>
                        {a.actionTab && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => { goToTab(a.actionTab!); toast.success("Navegando..."); }}
                          >
                            Ir <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "muted" | "destructive" | "amber" | "primary" }) {
  const toneCls = {
    muted: "bg-muted/50 text-foreground",
    destructive: "bg-destructive/10 text-destructive",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    primary: "bg-primary/10 text-primary",
  }[tone];
  return (
    <div className={`rounded-lg p-3 ${toneCls}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
