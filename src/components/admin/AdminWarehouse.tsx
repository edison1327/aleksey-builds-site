import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw, TrendingUp, Users, Truck, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

type Kpis = {
  period: { from: string; to: string };
  revenue: { invoiced: number; paid: number; pending: number };
  operations: { bookings: number; work_orders: number; wo_completed: number; incidents: number };
  commercial: { contact_messages: number; new_clients: number; rfqs: number };
  purchasing: { po_count: number; po_total: number };
  hr: { active_employees: number; hours_worked: number };
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 }).format(n || 0);

function toCsv(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  const csv = toCsv(rows);
  if (!csv) {
    toast.error("Sin datos para exportar");
    return;
  }
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminWarehouse() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [kRes, mRes, cRes, eRes] = await Promise.all([
        supabase.rpc("get_executive_kpis", { _from: from, _to: to }),
        supabase.from("dw_monthly_sales" as any).select("*").limit(24),
        supabase.from("dw_top_clients" as any).select("*").limit(50),
        supabase.from("dw_top_equipment" as any).select("*").limit(50),
      ]);
      if (kRes.error) throw kRes.error;
      setKpis(kRes.data as Kpis);
      setMonthly((mRes.data as any[]) || []);
      setClients((cRes.data as any[]) || []);
      setEquipment((eRes.data as any[]) || []);
    } catch (e: any) {
      toast.error(e.message || "Error cargando reportes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthlyChart = [...monthly]
    .slice(0, 12)
    .reverse()
    .map((r) => ({
      month: new Date(r.month).toLocaleDateString("es-PE", { month: "short", year: "2-digit" }),
      Facturado: Number(r.total_invoiced || 0),
      Cobrado: Number(r.total_paid || 0),
      Pendiente: Number(r.total_pending || 0),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> Data Warehouse
          </h2>
          <p className="text-sm text-muted-foreground">Reportes ejecutivos consolidados y exportables.</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button onClick={load} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </Button>
        </div>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Facturado</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">S/ {fmt(kpis.revenue.invoiced)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Cobrado</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">S/ {fmt(kpis.revenue.paid)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pendiente</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-600">S/ {fmt(kpis.revenue.pending)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Órdenes de Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.operations.work_orders}</div>
              <div className="text-xs text-muted-foreground">{kpis.operations.wo_completed} completadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Reservas</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpis.operations.bookings}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mensajes / RFQs</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.commercial.contact_messages}</div>
              <div className="text-xs text-muted-foreground">{kpis.commercial.rfqs} RFQs</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Compras (OC)</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.purchasing.po_count}</div>
              <div className="text-xs text-muted-foreground">S/ {fmt(kpis.purchasing.po_total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Horas trabajadas</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(kpis.hr.hours_worked)}</div>
              <div className="text-xs text-muted-foreground">{kpis.hr.active_employees} empleados activos</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly"><TrendingUp className="h-4 w-4 mr-2" />Ventas mensuales</TabsTrigger>
          <TabsTrigger value="clients"><Users className="h-4 w-4 mr-2" />Top clientes</TabsTrigger>
          <TabsTrigger value="equipment"><Truck className="h-4 w-4 mr-2" />Top equipos</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Ventas mensuales (últimos 12 meses)</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCsv(`ventas-mensuales-${today}.csv`, monthly)}>
                <Download className="h-4 w-4 mr-2" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: any) => `S/ ${fmt(Number(v))}`} />
                    <Legend />
                    <Bar dataKey="Facturado" fill="hsl(var(--primary))" />
                    <Bar dataKey="Cobrado" fill="hsl(var(--chart-2, 142 76% 36%))" />
                    <Bar dataKey="Pendiente" fill="hsl(var(--chart-3, 43 96% 56%))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Facturas</TableHead>
                      <TableHead className="text-right">Facturado</TableHead>
                      <TableHead className="text-right">Cobrado</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthly.map((r: any) => (
                      <TableRow key={r.month}>
                        <TableCell>{new Date(r.month).toLocaleDateString("es-PE", { year: "numeric", month: "long" })}</TableCell>
                        <TableCell className="text-right">{r.invoice_count}</TableCell>
                        <TableCell className="text-right">S/ {fmt(Number(r.total_invoiced))}</TableCell>
                        <TableCell className="text-right text-green-600">S/ {fmt(Number(r.total_paid))}</TableCell>
                        <TableCell className="text-right text-amber-600">S/ {fmt(Number(r.total_pending))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Top clientes (últimos 12 meses)</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCsv(`top-clientes-${today}.csv`, clients)}>
                <Download className="h-4 w-4 mr-2" />CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Facturas</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Cobrado</TableHead>
                    <TableHead>Última</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((r: any) => (
                    <TableRow key={r.customer_email}>
                      <TableCell className="font-medium">{r.customer_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.customer_email}</TableCell>
                      <TableCell className="text-right">{r.invoice_count}</TableCell>
                      <TableCell className="text-right">S/ {fmt(Number(r.total_revenue))}</TableCell>
                      <TableCell className="text-right text-green-600">S/ {fmt(Number(r.total_paid))}</TableCell>
                      <TableCell>{r.last_invoice_date ? new Date(r.last_invoice_date).toLocaleDateString("es-PE") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Top equipos por reservas (últimos 12 meses)</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCsv(`top-equipos-${today}.csv`, equipment)}>
                <Download className="h-4 w-4 mr-2" />CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-right">Reservas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((r: any, i: number) => (
                    <TableRow key={`${r.equipment_type}-${r.equipment_id}-${i}`}>
                      <TableCell className="capitalize">{r.equipment_type}</TableCell>
                      <TableCell className="font-medium">{r.equipment_name || "—"}</TableCell>
                      <TableCell className="text-right">{r.booking_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
