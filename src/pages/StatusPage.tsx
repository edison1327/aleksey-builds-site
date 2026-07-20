import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Wrench, Activity } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  operational: { label: "Operacional", color: "text-green-600 bg-green-50 dark:bg-green-950/30", icon: CheckCircle2 },
  degraded: { label: "Rendimiento degradado", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30", icon: AlertTriangle },
  partial_outage: { label: "Interrupción parcial", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30", icon: AlertTriangle },
  major_outage: { label: "Interrupción total", color: "text-red-600 bg-red-50 dark:bg-red-950/30", icon: XCircle },
  maintenance: { label: "En mantenimiento", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30", icon: Wrench },
};

export default function StatusPage() {
  const [components, setComponents] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("status_components").select("*").eq("is_visible", true).order("display_order"),
      supabase.from("status_incidents").select("*").order("created_at", { ascending: false }).limit(20),
    ]).then(([c, i]) => {
      setComponents(c.data || []);
      setIncidents(i.data || []);
      setLoading(false);
    });
  }, []);

  const allOk = components.length > 0 && components.every((c) => c.status === "operational");
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");

  return (
    <Layout>
      <Helmet>
        <title>Estado del sistema | Aleksey</title>
        <meta name="description" content="Estado en tiempo real de los servicios de Aleksey. Incidentes, mantenimientos y disponibilidad." />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/estado` : "/estado"} />
      </Helmet>

      <div className="pt-24 pb-16 container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Estado del sistema
          </h1>
          <p className="text-muted-foreground">Monitoreo en tiempo real de todos nuestros servicios</p>
        </div>

        {!loading && (
          <Card className={`p-6 mb-6 ${allOk ? "bg-green-50 dark:bg-green-950/30 border-green-200" : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200"}`}>
            <div className="flex items-center gap-3">
              {allOk ? <CheckCircle2 className="h-8 w-8 text-green-600" /> : <AlertTriangle className="h-8 w-8 text-yellow-600" />}
              <div>
                <h2 className="text-xl font-semibold">
                  {allOk ? "Todos los sistemas operativos" : "Algunos sistemas presentan inconvenientes"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Última actualización: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          </Card>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Componentes</h2>
          <div className="space-y-2">
            {components.map((c) => {
              const meta = STATUS_META[c.status] || STATUS_META.operational;
              const Icon = meta.icon;
              return (
                <Card key={c.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium">{c.name}</div>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  </div>
                  <Badge variant="outline" className={`${meta.color} border-transparent gap-1`}>
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </Badge>
                </Card>
              );
            })}
            {components.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-8">No hay componentes configurados aún.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            {activeIncidents.length > 0 ? "Incidentes activos" : "Historial reciente"}
          </h2>
          <div className="space-y-3">
            {(activeIncidents.length > 0 ? activeIncidents : incidents.slice(0, 10)).map((i) => (
              <Card key={i.id} className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={i.status === "resolved" ? "outline" : "destructive"}>{i.status}</Badge>
                  <Badge variant="secondary">{i.severity}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(i.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
                <div className="font-medium">{i.title}</div>
                {i.description && <p className="text-sm text-muted-foreground mt-1">{i.description}</p>}
                {i.resolved_at && (
                  <p className="text-xs text-green-600 mt-2">
                    Resuelto: {format(new Date(i.resolved_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  </p>
                )}
              </Card>
            ))}
            {incidents.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-8">Sin incidentes registrados.</p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
