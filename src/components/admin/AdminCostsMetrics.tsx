import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wrench, ClipboardCheck, CalendarRange, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];

type WO = { status: string; priority: string; estimated_cost: number | null; actual_cost: number | null; created_at: string };
type Svc = { cost: number | null; performed_at: string; equipment_type: string };
type Bkg = { status: string; start_date: string; end_date: string };

export default function AdminCostsMetrics() {
  const [wo, setWo] = useState<WO[]>([]);
  const [svc, setSvc] = useState<Svc[]>([]);
  const [bkg, setBkg] = useState<Bkg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = subDays(new Date(), 90).toISOString();
      const [a, b, c] = await Promise.all([
        supabase.from("work_orders").select("status,priority,estimated_cost,actual_cost,created_at").gte("created_at", since),
        supabase.from("equipment_service_log").select("cost,performed_at,equipment_type").gte("performed_at", since),
        supabase.from("equipment_bookings").select("status,start_date,end_date").gte("start_date", format(subDays(new Date(), 90), "yyyy-MM-dd")),
      ]);
      if (a.data) setWo(a.data as any);
      if (b.data) setSvc(b.data as any);
      if (c.data) setBkg(c.data as any);
      setLoading(false);
    })();
  }, []);

  const totals = useMemo(() => {
    const est = wo.reduce((s, w) => s + Number(w.estimated_cost || 0), 0);
    const real = wo.reduce((s, w) => s + Number(w.actual_cost || 0), 0);
    const maint = svc.reduce((s, x) => s + Number(x.cost || 0), 0);
    const openWo = wo.filter((w) => !["completed", "cancelled"].includes(w.status)).length;
    const bookings = bkg.length;
    return { est, real, maint, openWo, bookings, margin: est - real };
  }, [wo, svc, bkg]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    wo.forEach((w) => map.set(w.status, (map.get(w.status) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [wo]);

  const costByDay = useMemo(() => {
    const buckets = new Map<string, { day: string; real: number; est: number; mantto: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "dd/MM");
      buckets.set(d, { day: d, real: 0, est: 0, mantto: 0 });
    }
    wo.forEach((w) => {
      const k = format(startOfDay(new Date(w.created_at)), "dd/MM");
      const b = buckets.get(k);
      if (b) { b.real += Number(w.actual_cost || 0); b.est += Number(w.estimated_cost || 0); }
    });
    svc.forEach((s) => {
      const k = format(startOfDay(new Date(s.performed_at)), "dd/MM");
      const b = buckets.get(k);
      if (b) b.mantto += Number(s.cost || 0);
    });
    return Array.from(buckets.values());
  }, [wo, svc]);

  const priorityData = useMemo(() => {
    const map = new Map<string, number>();
    wo.forEach((w) => map.set(w.priority, (map.get(w.priority) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [wo]);

  const fmt = (n: number) => `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 0 })}`;

  const kpis = [
    { label: "Ingresos estimados (90d)", value: fmt(totals.est), icon: DollarSign, color: "text-emerald-500" },
    { label: "Costo real ejecutado", value: fmt(totals.real), icon: TrendingUp, color: "text-blue-500" },
    { label: "Costo mantenimiento", value: fmt(totals.maint), icon: Wrench, color: "text-amber-500" },
    { label: "Margen bruto (est − real)", value: fmt(totals.margin), icon: DollarSign, color: totals.margin >= 0 ? "text-emerald-500" : "text-destructive" },
    { label: "OT abiertas", value: String(totals.openWo), icon: ClipboardCheck, color: "text-primary" },
    { label: "Reservas (90d)", value: String(totals.bookings), icon: CalendarRange, color: "text-indigo-500" },
  ];

  if (loading) return <p className="text-muted-foreground text-sm p-6">Cargando métricas…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Dashboard de costos y métricas
        </h2>
        <p className="text-sm text-muted-foreground">Últimos 90 días · datos operativos y financieros.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <k.icon className={`h-4 w-4 ${k.color}`} /> {k.label}
              </div>
              <div className="text-xl font-bold mt-1">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Costos por día (últimos 30)</CardTitle></CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByDay}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="est" name="Estimado" fill="hsl(var(--primary))" />
                <Bar dataKey="real" name="Real" fill="#10b981" />
                <Bar dataKey="mantto" name="Mantto." fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">OTs por estado</CardTitle></CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Distribución por prioridad</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {priorityData.map((p) => (
              <Badge key={p.name} variant="outline" className="text-sm py-1">
                {p.name}: <b className="ml-1">{p.value}</b>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
