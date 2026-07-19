import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, TrendingUp, AlertTriangle, UserX, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type DemandRow = { service: string; month: string; bookings: number; forecast_next: number };
type MaintRow = { machinery_id: string; name: string; usage_hours: number; next_service_hours: number; hours_remaining: number; risk: string };
type ChurnRow = { customer_email: string; customer_name: string | null; last_activity: string; days_inactive: number; total_orders: number };
type CrossRow = { service_a: string; service_b: string; pair_count: number };

const riskColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-emerald-600 text-white",
};

export default function AdminPredictive() {
  const [loading, setLoading] = useState(true);
  const [demand, setDemand] = useState<DemandRow[]>([]);
  const [maint, setMaint] = useState<MaintRow[]>([]);
  const [churn, setChurn] = useState<ChurnRow[]>([]);
  const [cross, setCross] = useState<CrossRow[]>([]);

  const load = async () => {
    setLoading(true);
    const [d, m, c, x] = await Promise.all([
      supabase.rpc("get_demand_forecast"),
      supabase.rpc("get_maintenance_predictions"),
      supabase.rpc("get_customer_churn"),
      supabase.rpc("get_cross_sell"),
    ]);
    if (d.error) toast.error(d.error.message); else setDemand((d.data as DemandRow[]) || []);
    if (m.error) toast.error(m.error.message); else setMaint((m.data as MaintRow[]) || []);
    if (c.error) toast.error(c.error.message); else setChurn((c.data as ChurnRow[]) || []);
    if (x.error) toast.error(x.error.message); else setCross((x.data as CrossRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const services = Array.from(new Set(demand.map((r) => r.service)));
  const months = Array.from(new Set(demand.map((r) => r.month))).sort();
  const chartData = months.map((mo) => {
    const row: any = { month: mo.slice(0, 7) };
    for (const s of services) {
      const rec = demand.find((r) => r.service === s && r.month === mo);
      row[s] = rec?.bookings || 0;
    }
    return row;
  });
  const forecastRows = services.map((s) => ({
    service: s,
    forecast: demand.find((r) => r.service === s)?.forecast_next || 0,
  }));

  const notifyMaintTeam = async (m: MaintRow) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id!,
      type: "maintenance_predictive",
      title: `Mantenimiento sugerido: ${m.name}`,
      message: `${m.hours_remaining <= 0 ? "Vencido" : `Faltan ${m.hours_remaining}h`} — riesgo ${m.risk}`,
      link: "/admin#inventory",
    });
    if (error) toast.error(error.message); else toast.success("Notificación enviada");
  };

  const createChurnCampaign = async (c: ChurnRow) => {
    const url = `mailto:${c.customer_email}?subject=${encodeURIComponent("Te extrañamos")}&body=${encodeURIComponent(`Hola ${c.customer_name || ""}, hace ${c.days_inactive} días que no sabemos de ti. ¿Podemos ayudarte con un nuevo servicio?`)}`;
    window.location.href = url;
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Brain className="h-6 w-6" /> Inteligencia Predictiva</h2>
          <p className="text-muted-foreground text-sm">Forecast de demanda, mantenimiento predictivo, churn y cross-sell.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Recargar</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Forecast de demanda (12m)</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? <p className="text-muted-foreground text-sm">Sin datos suficientes.</p> : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  {services.map((s, i) => (
                    <Line key={s} type="monotone" dataKey={s} stroke={`hsl(${(i * 67) % 360} 70% 50%)`} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {forecastRows.map((f) => (
                  <div key={f.service} className="border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground uppercase">{f.service}</div>
                    <div className="text-xl font-bold">{f.forecast}</div>
                    <div className="text-xs text-muted-foreground">reservas prom. próximo mes</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Mantenimiento predictivo</CardTitle></CardHeader>
        <CardContent>
          {maint.length === 0 ? <p className="text-muted-foreground text-sm">Configura intervalos de servicio en Inventario.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Máquina</TableHead><TableHead>Uso (h)</TableHead><TableHead>Próximo (h)</TableHead>
                <TableHead>Restantes</TableHead><TableHead>Riesgo</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {maint.slice(0, 15).map((m) => (
                  <TableRow key={m.machinery_id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.usage_hours}</TableCell>
                    <TableCell>{m.next_service_hours}</TableCell>
                    <TableCell className={m.hours_remaining <= 0 ? "text-destructive font-bold" : ""}>{m.hours_remaining}</TableCell>
                    <TableCell><Badge className={riskColor[m.risk]}>{m.risk}</Badge></TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => notifyMaintTeam(m)}>Notificar</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserX className="h-5 w-5" /> Clientes en riesgo (churn)</CardTitle></CardHeader>
        <CardContent>
          {churn.length === 0 ? <p className="text-muted-foreground text-sm">No hay clientes inactivos &gt;90 días.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Cliente</TableHead><TableHead>Email</TableHead><TableHead>Última actividad</TableHead>
                <TableHead>Días inactivo</TableHead><TableHead>Órdenes</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {churn.slice(0, 15).map((c) => (
                  <TableRow key={c.customer_email}>
                    <TableCell className="font-medium">{c.customer_name || "—"}</TableCell>
                    <TableCell className="text-xs">{c.customer_email}</TableCell>
                    <TableCell className="text-xs">{new Date(c.last_activity).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={c.days_inactive > 180 ? "destructive" : "secondary"}>{c.days_inactive}d</Badge></TableCell>
                    <TableCell>{c.total_orders}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => createChurnCampaign(c)}>Contactar</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Recomendaciones cross-sell</CardTitle></CardHeader>
        <CardContent>
          {cross.length === 0 ? <p className="text-muted-foreground text-sm">Aún no hay pares de servicios frecuentes.</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cross.map((r, i) => (
                <div key={i} className="flex items-center justify-between border rounded p-3">
                  <span className="text-sm">{r.service_a} <span className="text-muted-foreground">+</span> {r.service_b}</span>
                  <Badge variant="secondary">{r.pair_count} clientes</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
