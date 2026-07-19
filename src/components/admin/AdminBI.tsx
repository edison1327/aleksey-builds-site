import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, BarChart, Bar, AreaChart, Area,
} from "recharts";
import { Loader2, Plus, TrendingUp, DollarSign, Wallet, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { logAction } from "@/lib/auditLog";

interface MonthlyPnL {
  month: string;
  invoiced: number;
  paid: number;
  purchase_cost: number;
  labor_cost: number;
  net: number;
}

interface ProjectPnL {
  project_id: string;
  project_title: string;
  planned_total: number;
  invoiced_total: number;
  paid_total: number;
  labor_cost: number;
  materials_cost: number;
  subcontract_cost: number;
  total_cost: number;
  margin: number;
  margin_pct: number;
}

interface CashRow {
  week: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface Budget {
  id: string;
  project_id: string;
  category: string;
  description: string | null;
  planned_amount: number;
  currency: string;
  notes: string | null;
}

interface Project { id: string; title: string; }

const fmt = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(n || 0);

const CATEGORIES = [
  { value: "labor", label: "Mano de obra" },
  { value: "materials", label: "Materiales" },
  { value: "machinery", label: "Maquinaria" },
  { value: "subcontract", label: "Subcontratos" },
  { value: "other", label: "Otros" },
];

const AdminBI = () => {
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<MonthlyPnL[]>([]);
  const [projects, setProjects] = useState<ProjectPnL[]>([]);
  const [cash, setCash] = useState<CashRow[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Budget>>({ category: "labor", currency: "PEN", planned_amount: 0 });

  const load = async () => {
    setLoading(true);
    const sb = supabase as unknown as {
      rpc: (fn: string) => Promise<{ data: unknown }>;
      from: typeof supabase.from;
    };
    const [m, p, c, pl, b] = await Promise.all([
      sb.rpc("get_monthly_pnl"),
      sb.rpc("get_project_pnl"),
      sb.rpc("get_cash_forecast"),
      supabase.from("projects").select("id, title").order("title"),
      supabase.from("project_budgets").select("*").order("created_at", { ascending: false }),
    ]);
    if (m.data) setMonthly(m.data as MonthlyPnL[]);
    if (p.data) setProjects(p.data as ProjectPnL[]);
    if (c.data) setCash(c.data as CashRow[]);
    if (pl.data) setProjectList(pl.data as Project[]);
    if (b.data) setBudgets(b.data as Budget[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const inv = monthly.reduce((s, r) => s + Number(r.invoiced || 0), 0);
    const paid = monthly.reduce((s, r) => s + Number(r.paid || 0), 0);
    const cost = monthly.reduce((s, r) => s + Number(r.purchase_cost || 0) + Number(r.labor_cost || 0), 0);
    const net = inv - cost;
    return { inv, paid, cost, net };
  }, [monthly]);

  const cashTotals = useMemo(() => {
    const inflow = cash.reduce((s, r) => s + Number(r.inflow || 0), 0);
    const outflow = cash.reduce((s, r) => s + Number(r.outflow || 0), 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [cash]);

  const alerts = useMemo(() => {
    const list: { level: "warn" | "critical"; title: string; msg: string }[] = [];

    // 1. Proyectos con margen negativo o bajo
    projects.forEach((p) => {
      const pct = Number(p.margin_pct);
      if (Number(p.total_cost) === 0 && Number(p.invoiced_total) === 0) return;
      if (pct < 0) {
        list.push({
          level: "critical",
          title: `Proyecto en pérdida: ${p.project_title}`,
          msg: `Margen ${pct.toFixed(1)}% — costo ${fmt(Number(p.total_cost))} vs facturado ${fmt(Number(p.invoiced_total))}`,
        });
      } else if (pct < 10) {
        list.push({
          level: "warn",
          title: `Margen bajo: ${p.project_title}`,
          msg: `Solo ${pct.toFixed(1)}% de margen (< 10% recomendado)`,
        });
      }
    });

    // 2. Presupuesto excedido por categoría
    const budgetByProject = new Map<string, Map<string, number>>();
    budgets.forEach((b) => {
      if (!budgetByProject.has(b.project_id)) budgetByProject.set(b.project_id, new Map());
      const m = budgetByProject.get(b.project_id)!;
      m.set(b.category, (m.get(b.category) || 0) + Number(b.planned_amount));
    });
    projects.forEach((p) => {
      const plans = budgetByProject.get(p.project_id);
      if (!plans) return;
      const checks: [string, number, string][] = [
        ["labor", Number(p.labor_cost), "Mano de obra"],
        ["materials", Number(p.materials_cost), "Materiales"],
        ["subcontract", Number(p.subcontract_cost), "Subcontratos"],
      ];
      checks.forEach(([cat, real, label]) => {
        const plan = plans.get(cat) || 0;
        if (plan > 0 && real > plan) {
          const over = ((real - plan) / plan) * 100;
          list.push({
            level: over > 20 ? "critical" : "warn",
            title: `Sobrecosto en ${p.project_title} — ${label}`,
            msg: `Real ${fmt(real)} supera plan ${fmt(plan)} (+${over.toFixed(0)}%)`,
          });
        }
      });
    });

    // 3. Liquidez negativa próximas 4 semanas
    const next4 = cash.slice(0, 4);
    const net4 = next4.reduce((s, r) => s + Number(r.net || 0), 0);
    if (next4.length && net4 < 0) {
      list.push({
        level: "critical",
        title: "Alerta de liquidez",
        msg: `Flujo neto proyectado próximas 4 semanas: ${fmt(net4)}`,
      });
    }

    // 4. Mes actual con costos > ingresos
    const now = new Date();
    const current = monthly.find((m) => {
      const d = new Date(m.month);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    if (current) {
      const cost = Number(current.purchase_cost) + Number(current.labor_cost);
      if (cost > Number(current.invoiced) && cost > 0) {
        list.push({
          level: "warn",
          title: "Costos superan ingresos este mes",
          msg: `Ingresos ${fmt(Number(current.invoiced))} vs costos ${fmt(cost)}`,
        });
      }
    }

    return list;
  }, [projects, budgets, cash, monthly]);

  const monthlyChart = monthly.map((m) => ({
    month: new Date(m.month).toLocaleDateString("es-PE", { month: "short", year: "2-digit" }),
    Ingresos: Number(m.invoiced),
    Costos: Number(m.purchase_cost) + Number(m.labor_cost),
    Neto: Number(m.net),
  }));

  const cashChart = cash.map((c) => ({
    semana: new Date(c.week).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
    Ingresos: Number(c.inflow),
    Egresos: Number(c.outflow),
    Neto: Number(c.net),
  }));

  const saveBudget = async () => {
    if (!form.project_id || !form.category || !form.planned_amount) {
      toast.error("Proyecto, categoría y monto son obligatorios");
      return;
    }
    const payload = {
      project_id: form.project_id,
      category: form.category,
      description: form.description || null,
      planned_amount: Number(form.planned_amount),
      currency: form.currency || "PEN",
      notes: form.notes || null,
    };
    const { error, data } = form.id
      ? await supabase.from("project_budgets").update(payload).eq("id", form.id).select().single()
      : await supabase.from("project_budgets").insert(payload).select().single();
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Presupuesto actualizado" : "Presupuesto creado");
    await logAction(form.id ? "update" : "create", "project_budget", data?.id, payload);
    setDialogOpen(false);
    setForm({ category: "labor", currency: "PEN", planned_amount: 0 });
    load();
  };

  const removeBudget = async (id: string) => {
    if (!confirm("¿Eliminar esta línea de presupuesto?")) return;
    const { error } = await supabase.from("project_budgets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logAction("delete", "project_budget", id);
    toast.success("Eliminado");
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            BI Ejecutivo & Presupuestos
          </h2>
          <p className="text-muted-foreground text-sm">
            Rentabilidad real por proyecto, P&L mensual y forecast de caja a 90 días
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refrescar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="projects">Por proyecto</TabsTrigger>
          <TabsTrigger value="cash">Forecast de caja</TabsTrigger>
          <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          {alerts.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Alertas financieras ({alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.slice(0, 8).map((a, i) => (
                  <Alert key={i} variant={a.level === "critical" ? "destructive" : "default"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm">{a.title}</AlertTitle>
                    <AlertDescription className="text-xs">{a.msg}</AlertDescription>
                  </Alert>
                ))}
                {alerts.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center">y {alerts.length - 8} más…</p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Ingresos 12m</p>
              <p className="text-xl font-bold">{fmt(totals.inv)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Cobrado</p>
              <p className="text-xl font-bold text-green-600">{fmt(totals.paid)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Costos totales</p>
              <p className="text-xl font-bold text-red-600">{fmt(totals.cost)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Margen neto</p>
              <p className={"text-xl font-bold " + (totals.net >= 0 ? "text-green-600" : "text-red-600")}>{fmt(totals.net)}</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">P&L mensual (últimos 12 meses)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RTooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="hsl(var(--primary))" />
                  <Bar dataKey="Costos" fill="hsl(var(--destructive))" />
                  <Bar dataKey="Neto" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Margen por proyecto</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead className="text-right">Presupuesto</TableHead>
                    <TableHead className="text-right">Facturado</TableHead>
                    <TableHead className="text-right">Cobrado</TableHead>
                    <TableHead className="text-right">MO</TableHead>
                    <TableHead className="text-right">Materiales</TableHead>
                    <TableHead className="text-right">Subcontratos</TableHead>
                    <TableHead className="text-right">Costo total</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Vincula OTs a proyectos (campo <code>project_id</code>) para ver rentabilidad.
                    </TableCell></TableRow>
                  ) : projects.map((p) => (
                    <TableRow key={p.project_id}>
                      <TableCell className="font-medium">{p.project_title}</TableCell>
                      <TableCell className="text-right">{fmt(Number(p.planned_total))}</TableCell>
                      <TableCell className="text-right">{fmt(Number(p.invoiced_total))}</TableCell>
                      <TableCell className="text-right text-green-600">{fmt(Number(p.paid_total))}</TableCell>
                      <TableCell className="text-right">{fmt(Number(p.labor_cost))}</TableCell>
                      <TableCell className="text-right">{fmt(Number(p.materials_cost))}</TableCell>
                      <TableCell className="text-right">{fmt(Number(p.subcontract_cost))}</TableCell>
                      <TableCell className="text-right text-red-600">{fmt(Number(p.total_cost))}</TableCell>
                      <TableCell className={"text-right font-semibold " + (Number(p.margin) >= 0 ? "text-green-600" : "text-red-600")}>
                        {fmt(Number(p.margin))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={Number(p.margin_pct) >= 15 ? "default" : Number(p.margin_pct) >= 0 ? "secondary" : "destructive"}>
                          {Number(p.margin_pct).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CASH FORECAST */}
        <TabsContent value="cash" className="space-y-4">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Ingresos esperados 90d</p>
              <p className="text-xl font-bold text-green-600">{fmt(cashTotals.inflow)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Egresos esperados 90d</p>
              <p className="text-xl font-bold text-red-600">{fmt(cashTotals.outflow)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Neto proyectado</p>
              <p className={"text-xl font-bold " + (cashTotals.net >= 0 ? "text-green-600" : "text-red-600")}>{fmt(cashTotals.net)}</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Forecast semanal (13 semanas)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={cashChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <RTooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="Ingresos" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                  <Area type="monotone" dataKey="Egresos" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.2)" />
                  <Line type="monotone" dataKey="Neto" stroke="hsl(var(--accent))" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BUDGETS */}
        <TabsContent value="budgets" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Define el presupuesto por categoría para cada proyecto; el margen se calcula contra costos reales.
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm({ category: "labor", currency: "PEN", planned_amount: 0 })}>
                  <Plus className="h-4 w-4 mr-1" /> Nueva línea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{form.id ? "Editar" : "Nueva"} línea de presupuesto</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Proyecto</Label>
                    <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Elegir proyecto" /></SelectTrigger>
                      <SelectContent>
                        {projectList.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Categoría</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Monto planificado</Label>
                      <Input type="number" step="0.01" value={form.planned_amount ?? 0}
                        onChange={(e) => setForm({ ...form, planned_amount: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Notas</Label>
                    <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={saveBudget}>Guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead />
                </TableRow></TableHeader>
                <TableBody>
                  {budgets.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aún no hay líneas de presupuesto.
                    </TableCell></TableRow>
                  ) : budgets.map((b) => {
                    const p = projectList.find((x) => x.id === b.project_id);
                    const cat = CATEGORIES.find((c) => c.value === b.category)?.label ?? b.category;
                    return (
                      <TableRow key={b.id}>
                        <TableCell>{p?.title ?? "—"}</TableCell>
                        <TableCell><Badge variant="outline">{cat}</Badge></TableCell>
                        <TableCell>{b.description || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(b.planned_amount))}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => { setForm(b); setDialogOpen(true); }}>Editar</Button>
                          <Button size="sm" variant="ghost" onClick={() => removeBudget(b.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBI;
