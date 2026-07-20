import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Timer, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Policy = {
  id: string;
  name: string;
  description: string | null;
  target_type: string;
  priority: string | null;
  first_response_minutes: number;
  resolution_minutes: number;
  business_hours_only: boolean;
  is_active: boolean;
  sort_order: number;
};

type Metric = {
  scope: string;
  total: number;
  breached: number;
  on_time: number;
  compliance_pct: number;
  avg_first_response_min: number;
  avg_resolution_min: number | null;
};

const emptyForm: Partial<Policy> = {
  name: "",
  description: "",
  target_type: "work_order",
  priority: null,
  first_response_minutes: 60,
  resolution_minutes: 1440,
  business_hours_only: false,
  is_active: true,
  sort_order: 0,
};

export default function AdminSLA() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Policy>>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("sla_policies").select("*").order("sort_order").order("name"),
      supabase.rpc("get_sla_metrics", { _days: 30 }),
    ]);
    setPolicies(p || []);
    setMetrics((m as Metric[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name?.trim()) return toast.error("Nombre requerido");
    const payload = { ...form, priority: form.priority || null };
    const { error } = editingId
      ? await supabase.from("sla_policies").update(payload).eq("id", editingId)
      : await supabase.from("sla_policies").insert(payload as any);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Política actualizada" : "Política creada");
    setOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const edit = (p: Policy) => {
    setForm(p);
    setEditingId(p.id);
    setOpen(true);
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar política?")) return;
    const { error } = await supabase.from("sla_policies").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const toggleActive = async (p: Policy) => {
    await supabase.from("sla_policies").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Timer className="h-6 w-6" /> SLA y tiempos de respuesta</h2>
        <p className="text-sm text-muted-foreground">Define acuerdos de nivel de servicio y monitorea cumplimiento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((m) => (
          <Card key={m.scope} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{m.scope === "work_orders" ? "Órdenes de trabajo" : "Mensajes de contacto"}</h3>
              <Badge variant={m.compliance_pct >= 90 ? "default" : m.compliance_pct >= 70 ? "secondary" : "destructive"}>
                {m.compliance_pct}% cumplimiento
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold">{m.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-5 w-5" />{m.on_time}
                </div>
                <div className="text-xs text-muted-foreground">A tiempo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                  <XCircle className="h-5 w-5" />{m.breached}
                </div>
                <div className="text-xs text-muted-foreground">Incumplidos</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground grid grid-cols-2 gap-2">
              <div>1ª respuesta prom.: <strong>{m.avg_first_response_min} min</strong></div>
              {m.avg_resolution_min !== null && <div>Resolución prom.: <strong>{m.avg_resolution_min} min</strong></div>}
            </div>
          </Card>
        ))}
        {metrics.length === 0 && !loading && (
          <Card className="p-6 col-span-2 text-center text-sm text-muted-foreground">
            Sin datos aún. Crea una política y espera que ingresen OTs/mensajes.
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Políticas ({policies.length})</h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva política</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nueva"} política SLA</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nombre (ej: OT urgente)" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Textarea placeholder="Descripción" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Aplica a</label>
                  <Select value={form.target_type} onValueChange={(v) => setForm({ ...form, target_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work_order">Órdenes de trabajo</SelectItem>
                      <SelectItem value="contact_message">Mensajes de contacto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Prioridad (opcional)</label>
                  <Select value={form.priority || "any"} onValueChange={(v) => setForm({ ...form, priority: v === "any" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Cualquiera</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">1ª respuesta (min)</label>
                  <Input type="number" value={form.first_response_minutes || 0} onChange={(e) => setForm({ ...form, first_response_minutes: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Resolución (min)</label>
                  <Input type="number" value={form.resolution_minutes || 0} onChange={(e) => setForm({ ...form, resolution_minutes: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  Activa
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={!!form.business_hours_only} onCheckedChange={(v) => setForm({ ...form, business_hours_only: v })} />
                  Solo horario laboral
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save}>{editingId ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{p.name}</span>
                    <Badge variant="outline">{p.target_type === "work_order" ? "OT" : "Mensajes"}</Badge>
                    {p.priority && <Badge variant="secondary">{p.priority}</Badge>}
                    {!p.is_active && <Badge variant="outline">Inactiva</Badge>}
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                  <div className="text-xs text-muted-foreground mt-2 flex gap-4">
                    <span>1ª resp: <strong>{p.first_response_minutes} min</strong></span>
                    <span>Resolución: <strong>{p.resolution_minutes} min</strong></span>
                    {p.business_hours_only && <span>Horario laboral</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                  <Button size="sm" variant="ghost" onClick={() => edit(p)}>Editar</Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
          {policies.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Sin políticas configuradas.</p>
          )}
        </div>
      )}
    </div>
  );
}
