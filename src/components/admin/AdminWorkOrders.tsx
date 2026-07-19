import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardCheck, Plus, Trash2, User, Calendar, CheckCircle2, FileDown } from "lucide-react";
import { exportWorkOrderPdf } from "@/lib/pdfExport";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ChecklistItem = { id: string; label: string; done: boolean };

type WO = {
  id: string;
  code: string;
  source_type: string;
  source_id: string | null;
  title: string;
  description: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  site_address: string | null;
  equipment_type: string | null;
  equipment_id: string | null;
  assigned_to: string | null;
  status: string;
  priority: string;
  checklist: ChecklistItem[];
  notes: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type Quote = { id: string; name: string | null; email: string | null; phone: string | null; message: string | null; subject: string | null };
type Staff = { user_id: string; email: string | null };

const STATUSES = [
  { v: "pending", label: "Pendiente" },
  { v: "in_progress", label: "En curso" },
  { v: "on_hold", label: "En pausa" },
  { v: "completed", label: "Completada" },
  { v: "cancelled", label: "Cancelada" },
];
const PRIORITIES = [
  { v: "low", label: "Baja" },
  { v: "normal", label: "Normal" },
  { v: "high", label: "Alta" },
  { v: "urgent", label: "Urgente" },
];

const statusBadge = (s: string) => {
  if (s === "completed") return "bg-emerald-500 text-white";
  if (s === "in_progress") return "bg-blue-500 text-white";
  if (s === "on_hold") return "bg-amber-500 text-white";
  if (s === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary";
};

export default function AdminWorkOrders() {
  const [items, setItems] = useState<WO[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WO | null>(null);
  const [form, setForm] = useState<any>({});
  const [newTask, setNewTask] = useState("");

  const load = async () => {
    setLoading(true);
    const [wo, cm, roles] = await Promise.all([
      supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("contact_messages").select("id,name,email,phone,message,subject").eq("status", "approved").order("created_at", { ascending: false }).limit(50),
      supabase.from("user_roles").select("user_id, role").in("role", ["admin", "editor"]),
    ]);
    if (wo.data) setItems(wo.data as any);
    if (cm.data) setQuotes(cm.data as any);
    if (roles.data) setStaff(roles.data.map((r: any) => ({ user_id: r.user_id, email: null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "mine") return items; // reserved
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const openNew = (fromQuote?: Quote) => {
    setEditing(null);
    setForm({
      source_type: fromQuote ? "quote" : "manual",
      source_id: fromQuote?.id || null,
      title: fromQuote ? (fromQuote.subject || `OT para ${fromQuote.name}`) : "",
      description: fromQuote?.message || "",
      customer_name: fromQuote?.name || "",
      customer_email: fromQuote?.email || "",
      customer_phone: fromQuote?.phone || "",
      site_address: "",
      status: "pending",
      priority: "normal",
      assigned_to: null,
      scheduled_start: "",
      scheduled_end: "",
      checklist: [] as ChecklistItem[],
      notes: "",
    });
    setOpen(true);
  };

  const openEdit = (wo: WO) => {
    setEditing(wo);
    setForm({
      ...wo,
      checklist: Array.isArray(wo.checklist) ? wo.checklist : [],
      scheduled_start: wo.scheduled_start?.slice(0, 16) || "",
      scheduled_end: wo.scheduled_end?.slice(0, 16) || "",
    });
    setOpen(true);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setForm({
      ...form,
      checklist: [...(form.checklist || []), { id: crypto.randomUUID(), label: newTask.trim(), done: false }],
    });
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setForm({
      ...form,
      checklist: (form.checklist || []).map((t: ChecklistItem) => t.id === id ? { ...t, done: !t.done } : t),
    });
  };

  const removeTask = (id: string) => {
    setForm({ ...form, checklist: (form.checklist || []).filter((t: ChecklistItem) => t.id !== id) });
  };

  const save = async () => {
    if (!form.title) { toast.error("Título requerido"); return; }
    const payload: any = {
      source_type: form.source_type,
      source_id: form.source_id || null,
      title: form.title,
      description: form.description || null,
      customer_name: form.customer_name || null,
      customer_email: form.customer_email || null,
      customer_phone: form.customer_phone || null,
      site_address: form.site_address || null,
      status: form.status,
      priority: form.priority,
      assigned_to: form.assigned_to || null,
      scheduled_start: form.scheduled_start ? new Date(form.scheduled_start).toISOString() : null,
      scheduled_end: form.scheduled_end ? new Date(form.scheduled_end).toISOString() : null,
      checklist: form.checklist || [],
      notes: form.notes || null,
    };
    if (form.status === "in_progress" && !editing?.started_at) payload.started_at = new Date().toISOString();
    if (form.status === "completed") payload.completed_at = new Date().toISOString();

    const { error } = editing
      ? await supabase.from("work_orders").update(payload).eq("id", editing.id)
      : await supabase.from("work_orders").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "OT actualizada" : "OT creada");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar OT?")) return;
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminada");
    load();
  };

  const progressOf = (wo: WO) => {
    const list = Array.isArray(wo.checklist) ? wo.checklist : [];
    if (!list.length) return 0;
    return Math.round((list.filter((t) => t.done).length / list.length) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" /> Órdenes de Trabajo
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Convierte cotizaciones aprobadas en OT con checklist para operarios.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => openNew()}><Plus className="h-4 w-4 mr-1" /> Nueva OT</Button>
          </div>
        </CardHeader>
        <CardContent>
          {quotes.length > 0 && (
            <div className="mb-4 p-3 rounded-md border border-border bg-muted/30">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Convertir cotización aprobada</p>
              <div className="flex gap-2 flex-wrap">
                {quotes.slice(0, 6).map((q) => (
                  <Button key={q.id} size="sm" variant="outline" onClick={() => openNew(q)}>
                    {q.name || q.email} → OT
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="col-span-full text-center text-muted-foreground py-6">Cargando…</p>
            ) : filtered.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-6">Sin órdenes.</p>
            ) : filtered.map((wo) => {
              const progress = progressOf(wo);
              return (
                <button key={wo.id} onClick={() => openEdit(wo)} className="text-left border border-border rounded-lg p-4 hover:border-primary/50 transition-colors bg-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">{wo.code}</p>
                      <p className="font-semibold text-sm">{wo.title}</p>
                    </div>
                    <Badge className={cn(statusBadge(wo.status))}>{STATUSES.find((s) => s.v === wo.status)?.label}</Badge>
                  </div>
                  {wo.customer_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> {wo.customer_name}</p>
                  )}
                  {wo.scheduled_start && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" /> {format(new Date(wo.scheduled_start), "d MMM HH:mm", { locale: es })}
                    </p>
                  )}
                  {Array.isArray(wo.checklist) && wo.checklist.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {wo.checklist.filter((t) => t.done).length}/{wo.checklist.length}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{PRIORITIES.find((p) => p.v === wo.priority)?.label}</Badge>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); remove(wo.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); remove(wo.id); } }}
                      className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `${editing.code}` : "Nueva orden de trabajo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cliente</Label>
                <Input value={form.customer_name || ""} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.customer_phone || ""} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Dirección obra</Label>
                <Input value={form.site_address || ""} onChange={(e) => setForm({ ...form, site_address: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Estado</Label>
                <Select value={form.status || "pending"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select value={form.priority || "normal"} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p.v} value={p.v}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Asignado a</Label>
                <Select value={form.assigned_to || "none"} onValueChange={(v) => setForm({ ...form, assigned_to: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {staff.map((s) => <SelectItem key={s.user_id} value={s.user_id}>{s.user_id.slice(0, 8)}…</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Inicio programado</Label>
                <Input type="datetime-local" value={form.scheduled_start || ""} onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })} />
              </div>
              <div>
                <Label>Fin programado</Label>
                <Input type="datetime-local" value={form.scheduled_end || ""} onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Checklist</Label>
              <div className="space-y-1 mt-1">
                {(form.checklist || []).map((t: ChecklistItem) => (
                  <div key={t.id} className="flex items-center gap-2 p-2 border border-border rounded-md">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                    <span className={cn("flex-1 text-sm", t.done && "line-through text-muted-foreground")}>{t.label}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeTask(t.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())} placeholder="Agregar tarea…" />
                  <Button variant="outline" onClick={addTask}>Añadir</Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
