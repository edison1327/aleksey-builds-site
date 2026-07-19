import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Clock, CalendarOff, Wallet, Plus, Check, X, Play, Award, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { exportCsv } from "@/lib/exportCsv";

type Employee = any;
type Cert = any;
type TimeEntry = any;
type Leave = any;
type Run = any;
type Item = any;

const EMP_ROLES = ["operario", "ingeniero", "técnico", "ayudante", "supervisor", "administración"];
const STATUSES = ["active", "on_leave", "terminated"];

export default function AdminHR() {
  const [tab, setTab] = useState("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [empDlg, setEmpDlg] = useState<Employee | null>(null);
  const [certDlg, setCertDlg] = useState<{ employee_id: string } & Partial<Cert> | null>(null);
  const [entryDlg, setEntryDlg] = useState<Partial<TimeEntry> | null>(null);
  const [leaveDlg, setLeaveDlg] = useState<Partial<Leave> | null>(null);
  const [runDlg, setRunDlg] = useState<Partial<Run> | null>(null);
  const [runDetail, setRunDetail] = useState<Run | null>(null);

  const load = async () => {
    setLoading(true);
    const [emps, cs, ts, ls, rs, wos] = await Promise.all([
      supabase.from("employees").select("*").order("full_name"),
      supabase.from("employee_certifications").select("*").order("expires_at", { ascending: true }),
      supabase.from("time_entries").select("*").order("entry_date", { ascending: false }).limit(500),
      supabase.from("leave_requests").select("*").order("start_date", { ascending: false }).limit(200),
      supabase.from("payroll_runs").select("*").order("period_year", { ascending: false }).order("period_month", { ascending: false }),
      supabase.from("work_orders").select("id,code,title").order("created_at", { ascending: false }).limit(200),
    ]);
    setEmployees(emps.data || []);
    setCerts(cs.data || []);
    setEntries(ts.data || []);
    setLeaves(ls.data || []);
    setRuns(rs.data || []);
    setWorkOrders(wos.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const empById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const woById = useMemo(() => Object.fromEntries(workOrders.map((w) => [w.id, w])), [workOrders]);

  // KPIs
  const activeCount = employees.filter((e) => e.status === "active").length;
  const expiringSoon = certs.filter((c) => c.expires_at && new Date(c.expires_at) <= new Date(Date.now() + 30 * 86400000)).length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const hoursThisMonth = useMemo(() => {
    const now = new Date();
    return entries.filter((e) => {
      if (!e.entry_date) return false;
      const d = new Date(e.entry_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).reduce((s, e) => s + Number(e.hours || 0), 0);
  }, [entries]);

  // ---- Employees CRUD
  const saveEmployee = async (e: Employee) => {
    const payload = { ...e };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    if (e.id) {
      const { error } = await supabase.from("employees").update(payload).eq("id", e.id);
      if (error) return toast.error(error.message);
      toast.success("Empleado actualizado");
    } else {
      const { error } = await supabase.from("employees").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Empleado creado");
    }
    setEmpDlg(null);
    load();
  };
  const deleteEmployee = async (id: string) => {
    if (!confirm("¿Eliminar empleado?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado"); load();
  };

  // ---- Certs
  const saveCert = async (c: any) => {
    const payload = { ...c };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    if (c.id) {
      const { error } = await supabase.from("employee_certifications").update(payload).eq("id", c.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("employee_certifications").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Guardado"); setCertDlg(null); load();
  };
  const deleteCert = async (id: string) => {
    if (!confirm("¿Eliminar certificación?")) return;
    await supabase.from("employee_certifications").delete().eq("id", id);
    load();
  };

  // ---- Time entries
  const saveEntry = async (e: any) => {
    const payload = { ...e };
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.hours;
    if (e.id) {
      const { error } = await supabase.from("time_entries").update(payload).eq("id", e.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("time_entries").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Guardado"); setEntryDlg(null); load();
  };
  const approveEntry = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("time_entries").update({
      approved: true, approved_by: u.user?.id, approved_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Aprobada"); load();
  };
  const deleteEntry = async (id: string) => {
    if (!confirm("¿Eliminar registro?")) return;
    await supabase.from("time_entries").delete().eq("id", id);
    load();
  };

  // ---- Leaves
  const saveLeave = async (l: any) => {
    const payload = { ...l };
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.days;
    if (l.id) {
      const { error } = await supabase.from("leave_requests").update(payload).eq("id", l.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("leave_requests").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Guardado"); setLeaveDlg(null); load();
  };
  const decideLeave = async (id: string, status: "approved" | "rejected") => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("leave_requests").update({
      status, reviewed_by: u.user?.id, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Aprobado" : "Rechazado"); load();
  };

  // ---- Payroll
  const createRun = async (r: any) => {
    const payload = { period_month: r.period_month, period_year: r.period_year, notes: r.notes, status: "draft" };
    const { data, error } = await supabase.from("payroll_runs").insert(payload).select().single();
    if (error) return toast.error(error.message);

    // Auto-generate items: sum approved hours of period per employee
    const from = new Date(r.period_year, r.period_month - 1, 1).toISOString().slice(0, 10);
    const to = new Date(r.period_year, r.period_month, 0).toISOString().slice(0, 10);
    const { data: te } = await supabase.from("time_entries")
      .select("employee_id, hours").eq("approved", true).gte("entry_date", from).lte("entry_date", to);
    const byEmp: Record<string, number> = {};
    (te || []).forEach((t: any) => { byEmp[t.employee_id] = (byEmp[t.employee_id] || 0) + Number(t.hours || 0); });
    const rows = Object.entries(byEmp).map(([employee_id, hours]) => {
      const emp = empById[employee_id];
      return {
        payroll_run_id: data.id,
        employee_id,
        hours_worked: hours,
        hourly_rate: emp?.hourly_rate || 0,
        bonuses: 0, deductions: 0,
      };
    });
    if (rows.length) await supabase.from("payroll_items").insert(rows);
    toast.success(`Nómina creada con ${rows.length} empleados`);
    setRunDlg(null); load();
  };
  const openRun = async (r: Run) => {
    setRunDetail(r);
    const { data } = await supabase.from("payroll_items").select("*").eq("payroll_run_id", r.id);
    setItems(data || []);
  };
  const updateItem = async (id: string, patch: any) => {
    const { error } = await supabase.from("payroll_items").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    const { data } = await supabase.from("payroll_items").select("*").eq("payroll_run_id", runDetail!.id);
    setItems(data || []);
  };
  const closeRun = async (r: Run) => {
    if (!confirm("¿Cerrar nómina? No podrás editar los ítems después.")) return;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("payroll_runs").update({
      status: "processed", processed_at: new Date().toISOString(), processed_by: u.user?.id,
    }).eq("id", r.id);
    toast.success("Cerrada"); setRunDetail(null); load();
  };
  const exportRunCsv = () => {
    exportCsv(
      `nomina-${runDetail?.period_year}-${String(runDetail?.period_month).padStart(2, "0")}.csv`,
      items,
      [
        { key: "employee_id", label: "Empleado", format: (v) => empById[v as string]?.full_name || "" },
        { key: "hours_worked", label: "Horas" },
        { key: "hourly_rate", label: "Tarifa" },
        { key: "base_pay", label: "Base" },
        { key: "bonuses", label: "Bonos" },
        { key: "deductions", label: "Descuentos" },
        { key: "net_pay", label: "Neto" },
      ],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" />RRHH y equipo</h2>
          <p className="text-muted-foreground text-sm">Empleados, horas trabajadas, permisos y nómina.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Activos</div><div className="text-2xl font-bold">{activeCount}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Horas este mes</div><div className="text-2xl font-bold">{hoursThisMonth.toFixed(1)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Permisos pendientes</div><div className="text-2xl font-bold">{pendingLeaves}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Cert. por vencer (30d)</div><div className="text-2xl font-bold text-orange-500">{expiringSoon}</div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="employees"><Users className="w-4 h-4 mr-1" />Empleados</TabsTrigger>
          <TabsTrigger value="certs"><Award className="w-4 h-4 mr-1" />Certificaciones {expiringSoon > 0 && <Badge className="ml-1" variant="destructive">{expiringSoon}</Badge>}</TabsTrigger>
          <TabsTrigger value="time"><Clock className="w-4 h-4 mr-1" />Horas</TabsTrigger>
          <TabsTrigger value="leave"><CalendarOff className="w-4 h-4 mr-1" />Permisos {pendingLeaves > 0 && <Badge className="ml-1">{pendingLeaves}</Badge>}</TabsTrigger>
          <TabsTrigger value="payroll"><Wallet className="w-4 h-4 mr-1" />Nómina</TabsTrigger>
        </TabsList>

        {/* EMPLEADOS */}
        <TabsContent value="employees" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setEmpDlg({ status: "active", role: "operario", currency: "PEN" })}><Plus className="w-4 h-4 mr-1" />Nuevo empleado</Button>
          </div>
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Código</TableHead><TableHead>Nombre</TableHead><TableHead>Rol</TableHead>
                <TableHead>Tarifa/h</TableHead><TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.code || "—"}</TableCell>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell><Badge variant="outline">{e.role}</Badge></TableCell>
                    <TableCell>{e.currency} {Number(e.hourly_rate || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{[e.phone, e.email].filter(Boolean).join(" · ")}</TableCell>
                    <TableCell><Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setEmpDlg(e)}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteEmployee(e.id)}><X className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin empleados</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* CERTIFICACIONES */}
        <TabsContent value="certs" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setCertDlg({ employee_id: employees[0]?.id || "" } as any)}><Plus className="w-4 h-4 mr-1" />Nueva certificación</Button>
          </div>
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Empleado</TableHead><TableHead>Tipo</TableHead><TableHead>N°</TableHead>
                <TableHead>Emisor</TableHead><TableHead>Vence</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {certs.map((c) => {
                  const days = c.expires_at ? Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>{empById[c.employee_id]?.full_name || "—"}</TableCell>
                      <TableCell>{c.cert_type}</TableCell>
                      <TableCell className="text-xs">{c.cert_number || "—"}</TableCell>
                      <TableCell className="text-xs">{c.issuer || "—"}</TableCell>
                      <TableCell>
                        {c.expires_at ? (
                          <span className={days !== null && days <= 30 ? "text-orange-500 font-medium" : ""}>
                            {c.expires_at} {days !== null && days <= 30 && `(${days}d)`}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setCertDlg(c)}>Editar</Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteCert(c.id)}><X className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {certs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin certificaciones</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* HORAS */}
        <TabsContent value="time" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setEntryDlg({ entry_date: new Date().toISOString().slice(0, 10), employee_id: employees[0]?.id })}><Plus className="w-4 h-4 mr-1" />Registrar horas</Button>
          </div>
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Fecha</TableHead><TableHead>Empleado</TableHead><TableHead>OT</TableHead>
                <TableHead>Entrada</TableHead><TableHead>Salida</TableHead><TableHead>Horas</TableHead>
                <TableHead>Estado</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {entries.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.entry_date}</TableCell>
                    <TableCell>{empById[t.employee_id]?.full_name || "—"}</TableCell>
                    <TableCell className="text-xs">{t.work_order_id ? woById[t.work_order_id]?.code : "—"}</TableCell>
                    <TableCell className="text-xs">{t.check_in ? format(new Date(t.check_in), "HH:mm") : "—"}</TableCell>
                    <TableCell className="text-xs">{t.check_out ? format(new Date(t.check_out), "HH:mm") : "—"}</TableCell>
                    <TableCell className="font-medium">{Number(t.hours || 0).toFixed(2)}</TableCell>
                    <TableCell>{t.approved ? <Badge>Aprobada</Badge> : <Badge variant="secondary">Pend.</Badge>}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {!t.approved && <Button size="sm" onClick={() => approveEntry(t.id)}><Check className="w-4 h-4" /></Button>}
                      <Button size="sm" variant="outline" onClick={() => setEntryDlg(t)}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteEntry(t.id)}><X className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin registros</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* PERMISOS */}
        <TabsContent value="leave" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setLeaveDlg({ leave_type: "vacation", status: "pending", employee_id: employees[0]?.id })}><Plus className="w-4 h-4 mr-1" />Nueva solicitud</Button>
          </div>
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Empleado</TableHead><TableHead>Tipo</TableHead><TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead><TableHead>Días</TableHead><TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {leaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{empById[l.employee_id]?.full_name || "—"}</TableCell>
                    <TableCell>{l.leave_type}</TableCell>
                    <TableCell>{l.start_date}</TableCell>
                    <TableCell>{l.end_date}</TableCell>
                    <TableCell>{l.days}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs">{l.reason || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {l.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => decideLeave(l.id, "approved")}><Check className="w-4 h-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => decideLeave(l.id, "rejected")}><X className="w-4 h-4" /></Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setLeaveDlg(l)}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {leaves.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin solicitudes</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* NÓMINA */}
        <TabsContent value="payroll" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setRunDlg({ period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() })}><Plus className="w-4 h-4 mr-1" />Nueva nómina</Button>
          </div>
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Periodo</TableHead><TableHead>Estado</TableHead>
                <TableHead>Bruto</TableHead><TableHead>Neto</TableHead>
                <TableHead>Procesada</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.period_year}-{String(r.period_month).padStart(2, "0")}</TableCell>
                    <TableCell><Badge variant={r.status === "processed" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                    <TableCell>{r.currency} {Number(r.total_gross || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">{r.currency} {Number(r.total_net || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{r.processed_at ? format(new Date(r.processed_at), "dd/MM/yyyy HH:mm") : "—"}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openRun(r)}><Play className="w-4 h-4 mr-1" />Abrir</Button></TableCell>
                  </TableRow>
                ))}
                {runs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin nóminas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Employee dialog */}
      <Dialog open={!!empDlg} onOpenChange={(o) => !o && setEmpDlg(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{empDlg?.id ? "Editar" : "Nuevo"} empleado</DialogTitle></DialogHeader>
          {empDlg && (
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Nombre*</Label><Input value={empDlg.full_name || ""} onChange={(e) => setEmpDlg({ ...empDlg, full_name: e.target.value })} /></div>
              <div><Label>Código</Label><Input value={empDlg.code || ""} onChange={(e) => setEmpDlg({ ...empDlg, code: e.target.value })} /></div>
              <div><Label>Documento</Label><Input value={empDlg.document || ""} onChange={(e) => setEmpDlg({ ...empDlg, document: e.target.value })} /></div>
              <div><Label>Rol</Label>
                <Select value={empDlg.role} onValueChange={(v) => setEmpDlg({ ...empDlg, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EMP_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Estado</Label>
                <Select value={empDlg.status} onValueChange={(v) => setEmpDlg({ ...empDlg, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Teléfono</Label><Input value={empDlg.phone || ""} onChange={(e) => setEmpDlg({ ...empDlg, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={empDlg.email || ""} onChange={(e) => setEmpDlg({ ...empDlg, email: e.target.value })} /></div>
              <div><Label>Fecha ingreso</Label><Input type="date" value={empDlg.hire_date || ""} onChange={(e) => setEmpDlg({ ...empDlg, hire_date: e.target.value })} /></div>
              <div><Label>Tarifa/hora</Label><Input type="number" step="0.01" value={empDlg.hourly_rate || 0} onChange={(e) => setEmpDlg({ ...empDlg, hourly_rate: Number(e.target.value) })} /></div>
              <div><Label>Base mensual</Label><Input type="number" step="0.01" value={empDlg.monthly_base || 0} onChange={(e) => setEmpDlg({ ...empDlg, monthly_base: Number(e.target.value) })} /></div>
              <div><Label>Moneda</Label><Input value={empDlg.currency || "PEN"} onChange={(e) => setEmpDlg({ ...empDlg, currency: e.target.value })} /></div>
              <div><Label>Foto (URL)</Label><Input value={empDlg.photo_url || ""} onChange={(e) => setEmpDlg({ ...empDlg, photo_url: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Dirección</Label><Input value={empDlg.address || ""} onChange={(e) => setEmpDlg({ ...empDlg, address: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Contacto emergencia</Label><Input value={empDlg.emergency_contact || ""} onChange={(e) => setEmpDlg({ ...empDlg, emergency_contact: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Notas</Label><Textarea value={empDlg.notes || ""} onChange={(e) => setEmpDlg({ ...empDlg, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpDlg(null)}>Cancelar</Button>
            <Button onClick={() => empDlg && saveEmployee(empDlg)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cert dialog */}
      <Dialog open={!!certDlg} onOpenChange={(o) => !o && setCertDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{certDlg?.id ? "Editar" : "Nueva"} certificación</DialogTitle></DialogHeader>
          {certDlg && (
            <div className="space-y-3">
              <div><Label>Empleado</Label>
                <Select value={certDlg.employee_id} onValueChange={(v) => setCertDlg({ ...certDlg, employee_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tipo*</Label><Input value={(certDlg as any).cert_type || ""} onChange={(e) => setCertDlg({ ...certDlg, cert_type: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>N° certificado</Label><Input value={(certDlg as any).cert_number || ""} onChange={(e) => setCertDlg({ ...certDlg, cert_number: e.target.value })} /></div>
                <div><Label>Emisor</Label><Input value={(certDlg as any).issuer || ""} onChange={(e) => setCertDlg({ ...certDlg, issuer: e.target.value })} /></div>
                <div><Label>Emitido</Label><Input type="date" value={(certDlg as any).issued_at || ""} onChange={(e) => setCertDlg({ ...certDlg, issued_at: e.target.value })} /></div>
                <div><Label>Vence</Label><Input type="date" value={(certDlg as any).expires_at || ""} onChange={(e) => setCertDlg({ ...certDlg, expires_at: e.target.value })} /></div>
              </div>
              <div><Label>Archivo (URL)</Label><Input value={(certDlg as any).file_url || ""} onChange={(e) => setCertDlg({ ...certDlg, file_url: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={(certDlg as any).notes || ""} onChange={(e) => setCertDlg({ ...certDlg, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertDlg(null)}>Cancelar</Button>
            <Button onClick={() => certDlg && saveCert(certDlg)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time entry dialog */}
      <Dialog open={!!entryDlg} onOpenChange={(o) => !o && setEntryDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{entryDlg?.id ? "Editar" : "Registrar"} horas</DialogTitle></DialogHeader>
          {entryDlg && (
            <div className="space-y-3">
              <div><Label>Empleado</Label>
                <Select value={entryDlg.employee_id} onValueChange={(v) => setEntryDlg({ ...entryDlg, employee_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>OT (opcional)</Label>
                <Select value={entryDlg.work_order_id || "none"} onValueChange={(v) => setEntryDlg({ ...entryDlg, work_order_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin OT —</SelectItem>
                    {workOrders.map((w) => <SelectItem key={w.id} value={w.id}>{w.code} · {w.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Fecha</Label><Input type="date" value={entryDlg.entry_date || ""} onChange={(e) => setEntryDlg({ ...entryDlg, entry_date: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Entrada</Label><Input type="datetime-local" value={entryDlg.check_in?.slice(0, 16) || ""} onChange={(e) => setEntryDlg({ ...entryDlg, check_in: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
                <div><Label>Salida</Label><Input type="datetime-local" value={entryDlg.check_out?.slice(0, 16) || ""} onChange={(e) => setEntryDlg({ ...entryDlg, check_out: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
              </div>
              <div><Label>Notas</Label><Textarea value={entryDlg.notes || ""} onChange={(e) => setEntryDlg({ ...entryDlg, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryDlg(null)}>Cancelar</Button>
            <Button onClick={() => entryDlg && saveEntry(entryDlg)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave dialog */}
      <Dialog open={!!leaveDlg} onOpenChange={(o) => !o && setLeaveDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{leaveDlg?.id ? "Editar" : "Nueva"} solicitud</DialogTitle></DialogHeader>
          {leaveDlg && (
            <div className="space-y-3">
              <div><Label>Empleado</Label>
                <Select value={leaveDlg.employee_id} onValueChange={(v) => setLeaveDlg({ ...leaveDlg, employee_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tipo</Label>
                <Select value={leaveDlg.leave_type} onValueChange={(v) => setLeaveDlg({ ...leaveDlg, leave_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacaciones</SelectItem>
                    <SelectItem value="sick">Enfermedad</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="unpaid">Sin goce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Inicio</Label><Input type="date" value={leaveDlg.start_date || ""} onChange={(e) => setLeaveDlg({ ...leaveDlg, start_date: e.target.value })} /></div>
                <div><Label>Fin</Label><Input type="date" value={leaveDlg.end_date || ""} onChange={(e) => setLeaveDlg({ ...leaveDlg, end_date: e.target.value })} /></div>
              </div>
              <div><Label>Motivo</Label><Textarea value={leaveDlg.reason || ""} onChange={(e) => setLeaveDlg({ ...leaveDlg, reason: e.target.value })} /></div>
              <div><Label>Estado</Label>
                <Select value={leaveDlg.status} onValueChange={(v) => setLeaveDlg({ ...leaveDlg, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDlg(null)}>Cancelar</Button>
            <Button onClick={() => leaveDlg && saveLeave(leaveDlg)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll new dialog */}
      <Dialog open={!!runDlg} onOpenChange={(o) => !o && setRunDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva nómina</DialogTitle></DialogHeader>
          {runDlg && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Mes</Label><Input type="number" min={1} max={12} value={runDlg.period_month} onChange={(e) => setRunDlg({ ...runDlg, period_month: Number(e.target.value) })} /></div>
                <div><Label>Año</Label><Input type="number" value={runDlg.period_year} onChange={(e) => setRunDlg({ ...runDlg, period_year: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Notas</Label><Textarea value={runDlg.notes || ""} onChange={(e) => setRunDlg({ ...runDlg, notes: e.target.value })} /></div>
              <p className="text-xs text-muted-foreground">Se generarán ítems automáticamente sumando las horas aprobadas del periodo por cada empleado.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDlg(null)}>Cancelar</Button>
            <Button onClick={() => runDlg && createRun(runDlg)}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll detail dialog */}
      <Dialog open={!!runDetail} onOpenChange={(o) => !o && setRunDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nómina {runDetail?.period_year}-{String(runDetail?.period_month).padStart(2, "0")}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mb-2">
            <Button size="sm" variant="outline" onClick={exportRunCsv}><Download className="w-4 h-4 mr-1" />CSV</Button>
            {runDetail?.status === "draft" && <Button size="sm" onClick={() => runDetail && closeRun(runDetail)}>Cerrar nómina</Button>}
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Empleado</TableHead><TableHead>Horas</TableHead><TableHead>Tarifa</TableHead>
              <TableHead>Base</TableHead><TableHead>Bonos</TableHead><TableHead>Desc.</TableHead>
              <TableHead>Neto</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((it) => {
                const readonly = runDetail?.status !== "draft";
                return (
                  <TableRow key={it.id}>
                    <TableCell>{empById[it.employee_id]?.full_name || "—"}</TableCell>
                    <TableCell><Input className="w-20" type="number" step="0.25" disabled={readonly} value={it.hours_worked} onChange={(e) => updateItem(it.id, { hours_worked: Number(e.target.value) })} /></TableCell>
                    <TableCell><Input className="w-24" type="number" step="0.01" disabled={readonly} value={it.hourly_rate} onChange={(e) => updateItem(it.id, { hourly_rate: Number(e.target.value) })} /></TableCell>
                    <TableCell className="text-xs">{Number(it.base_pay).toFixed(2)}</TableCell>
                    <TableCell><Input className="w-24" type="number" step="0.01" disabled={readonly} value={it.bonuses} onChange={(e) => updateItem(it.id, { bonuses: Number(e.target.value) })} /></TableCell>
                    <TableCell><Input className="w-24" type="number" step="0.01" disabled={readonly} value={it.deductions} onChange={(e) => updateItem(it.id, { deductions: Number(e.target.value) })} /></TableCell>
                    <TableCell className="font-medium">{Number(it.net_pay).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Sin ítems</TableCell></TableRow>}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
