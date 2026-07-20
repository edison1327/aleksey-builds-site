import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ClipboardCheck, AlertTriangle, CheckCircle2, MapPin, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SignaturePad } from "@/components/operator/SignaturePad";
import { format } from "date-fns";

type Template = {
  id: string;
  name: string;
  equipment_type: "machinery" | "vehicle" | "both";
  moment: "pre_use" | "post_use" | "both";
  description: string | null;
  active: boolean;
};

type TemplateItem = {
  id: string;
  template_id: string;
  label: string;
  item_type: "ok_fail" | "text" | "number" | "photo";
  critical: boolean;
  sort_order: number;
};

type Inspection = {
  id: string;
  template_id: string | null;
  work_order_id: string | null;
  machinery_id: string | null;
  vehicle_id: string | null;
  operator_name: string | null;
  moment: string;
  status: "approved" | "with_observations" | "rejected";
  notes: string | null;
  created_at: string;
};

const statusMeta: Record<string, { label: string; variant: any; icon: any }> = {
  approved: { label: "Aprobada", variant: "default", icon: CheckCircle2 },
  with_observations: { label: "Con observaciones", variant: "secondary", icon: AlertTriangle },
  rejected: { label: "Rechazada", variant: "destructive", icon: AlertTriangle },
};

export default function AdminInspections() {
  const [tab, setTab] = useState("inspections");

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Inspecciones de equipos</h1>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inspections">Inspecciones</TabsTrigger>
          <TabsTrigger value="new">Nueva inspección</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>
        <TabsContent value="inspections"><InspectionsList /></TabsContent>
        <TabsContent value="new"><NewInspection onDone={() => setTab("inspections")} /></TabsContent>
        <TabsContent value="templates"><TemplatesManager /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────── LIST ─────── */
function InspectionsList() {
  const [rows, setRows] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Inspection | null>(null);
  const [responses, setResponses] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("equipment_inspections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openDetail = async (i: Inspection) => {
    setDetail(i);
    const { data } = await supabase
      .from("inspection_responses").select("*").eq("inspection_id", i.id).order("created_at");
    setResponses(data || []);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Aún no hay inspecciones registradas.</p>;

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {rows.map((r) => {
              const m = statusMeta[r.status] || statusMeta.approved;
              const Icon = m.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => openDetail(r)}
                  className="w-full text-left p-3 hover:bg-muted/50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium truncate">
                        {r.operator_name || "Sin operador"} · {r.moment === "pre_use" ? "Pre-uso" : "Post-uso"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {format(new Date(r.created_at), "dd/MM/yyyy HH:mm")} · {r.notes || "—"}
                    </p>
                  </div>
                  <Badge variant={m.variant}>{m.label}</Badge>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de inspección</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Operador:</span> {detail.operator_name || "—"}</div>
                <div><span className="text-muted-foreground">Momento:</span> {detail.moment}</div>
                <div><span className="text-muted-foreground">Estado:</span> {statusMeta[detail.status].label}</div>
                <div><span className="text-muted-foreground">Fecha:</span> {format(new Date(detail.created_at), "dd/MM/yyyy HH:mm")}</div>
              </div>
              {detail.notes && <p className="p-2 rounded bg-muted text-xs">{detail.notes}</p>}
              <div className="space-y-2">
                {responses.map((r) => (
                  <div key={r.id} className={`p-2 rounded border ${r.is_fail ? "border-destructive/50 bg-destructive/5" : "border-border"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{r.label} {r.critical && <Badge variant="destructive" className="ml-1 text-[10px]">Crítico</Badge>}</span>
                      <Badge variant={r.is_fail ? "destructive" : "secondary"}>{r.value || (r.is_fail ? "Falla" : "OK")}</Badge>
                    </div>
                    {r.observation && <p className="text-xs text-muted-foreground mt-1">{r.observation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────── TEMPLATES ─────── */
function TemplatesManager() {
  const [tpls, setTpls] = useState<Template[]>([]);
  const [items, setItems] = useState<Record<string, TemplateItem[]>>({});
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ name: "", equipment_type: "machinery", moment: "pre_use", description: "" });

  const load = async () => {
    const { data } = await supabase.from("inspection_templates").select("*").order("created_at", { ascending: false });
    setTpls((data as any) || []);
    if (data && data.length) {
      const { data: it } = await supabase.from("inspection_template_items").select("*")
        .in("template_id", data.map((t: any) => t.id)).order("sort_order");
      const grouped: Record<string, TemplateItem[]> = {};
      (it || []).forEach((i: any) => { (grouped[i.template_id] ||= []).push(i); });
      setItems(grouped);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    const { error } = await supabase.from("inspection_templates").insert(form as any);
    if (error) return toast.error(error.message);
    toast.success("Plantilla creada");
    setOpenNew(false); setForm({ name: "", equipment_type: "machinery", moment: "pre_use", description: "" });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar plantilla?")) return;
    await supabase.from("inspection_templates").delete().eq("id", id);
    load();
  };

  const addItem = async (tplId: string) => {
    const label = prompt("Nombre del ítem:");
    if (!label) return;
    const critical = confirm("¿Es un ítem crítico? (una falla → rechazo automático)");
    const order = (items[tplId]?.length || 0) + 1;
    await supabase.from("inspection_template_items").insert({
      template_id: tplId, label, item_type: "ok_fail", critical, sort_order: order,
    } as any);
    load();
  };

  const delItem = async (id: string) => {
    await supabase.from("inspection_template_items").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva plantilla</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva plantilla</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tipo de equipo</Label>
                  <Select value={form.equipment_type} onValueChange={(v) => setForm({ ...form, equipment_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="machinery">Maquinaria</SelectItem>
                      <SelectItem value="vehicle">Vehículo</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Momento</Label>
                  <Select value={form.moment} onValueChange={(v) => setForm({ ...form, moment: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre_use">Pre-uso</SelectItem>
                      <SelectItem value="post_use">Post-uso</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={create} className="w-full">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tpls.length === 0 && <p className="text-sm text-muted-foreground">No hay plantillas. Crea una para empezar.</p>}
      {tpls.map((t) => (
        <Card key={t.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{t.equipment_type}</Badge>
                  <Badge variant="outline">{t.moment}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(items[t.id] || []).map((i) => (
              <div key={i.id} className="flex items-center justify-between border-b border-border/50 py-1 text-sm">
                <span>{i.sort_order}. {i.label} {i.critical && <Badge variant="destructive" className="ml-1 text-[10px]">Crítico</Badge>}</span>
                <Button variant="ghost" size="sm" onClick={() => delItem(i.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addItem(t.id)}><Plus className="h-4 w-4 mr-1" />Añadir ítem</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─────── NEW INSPECTION ─────── */
function NewInspection({ onDone }: { onDone: () => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [machinery, setMachinery] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [tplId, setTplId] = useState<string>("");
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [moment, setMoment] = useState<"pre_use" | "post_use">("pre_use");
  const [operatorName, setOperatorName] = useState("");
  const [machineryId, setMachineryId] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [workOrderId, setWorkOrderId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, { value: string; is_fail: boolean; observation: string }>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, m, v, w] = await Promise.all([
        supabase.from("inspection_templates").select("*").eq("active", true).order("name"),
        supabase.from("machinery").select("id,name").limit(200),
        supabase.from("vehicles").select("id,name").limit(200),
        supabase.from("work_orders").select("id,order_number,title").order("created_at", { ascending: false }).limit(50),
      ]);
      setTemplates((t.data as any) || []);
      setMachinery(m.data || []);
      setVehicles(v.data || []);
      setWorkOrders(w.data || []);
    })();
  }, []);

  useEffect(() => {
    if (!tplId) { setItems([]); return; }
    supabase.from("inspection_template_items").select("*").eq("template_id", tplId)
      .order("sort_order").then(({ data }) => setItems((data as any) || []));
  }, [tplId]);

  const captureGps = () => {
    navigator.geolocation.getCurrentPosition(
      (p) => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude }); toast.success("Ubicación capturada"); },
      () => toast.error("No se pudo capturar GPS"),
      { timeout: 8000 }
    );
  };

  const compute = () => {
    let hasFail = false, hasCriticalFail = false;
    items.forEach((it) => {
      const a = answers[it.id];
      if (a?.is_fail) { hasFail = true; if (it.critical) hasCriticalFail = true; }
    });
    return hasCriticalFail ? "rejected" : hasFail ? "with_observations" : "approved";
  };

  const save = async () => {
    if (!tplId) return toast.error("Selecciona una plantilla");
    if (!operatorName.trim()) return toast.error("Ingresa el nombre del operador");
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const status = compute();

      let sigUrl: string | null = null;
      if (signature) {
        // upload png
        const blob = await (await fetch(signature)).blob();
        const path = `${user.user?.id || "anon"}/inspections/${Date.now()}-sig.png`;
        const { error: upErr } = await supabase.storage.from("work-order-media")
          .upload(path, blob, { contentType: "image/png", upsert: false });
        if (!upErr) sigUrl = path;
      }

      const { data: insp, error } = await supabase.from("equipment_inspections").insert({
        template_id: tplId,
        moment,
        operator_id: user.user?.id,
        operator_name: operatorName,
        machinery_id: machineryId || null,
        vehicle_id: vehicleId || null,
        work_order_id: workOrderId || null,
        gps_lat: gps?.lat, gps_lng: gps?.lng,
        signature_url: sigUrl,
        notes,
        status,
      } as any).select().single();
      if (error) throw error;

      const rows = items.map((it) => {
        const a = answers[it.id] || { value: "", is_fail: false, observation: "" };
        return {
          inspection_id: insp!.id,
          item_id: it.id,
          label: it.label,
          critical: it.critical,
          value: a.value || (a.is_fail ? "Falla" : "OK"),
          is_fail: a.is_fail,
          observation: a.observation || null,
        };
      });
      if (rows.length) await supabase.from("inspection_responses").insert(rows as any);

      toast.success(`Inspección guardada: ${statusMeta[status].label}`);
      onDone();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally { setSaving(false); }
  };

  const status = compute();
  const StatusIcon = statusMeta[status].icon;

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader><CardTitle className="text-base">Datos generales</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Plantilla *</Label>
              <Select value={tplId} onValueChange={setTplId}>
                <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Momento</Label>
              <Select value={moment} onValueChange={(v: any) => setMoment(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_use">Pre-uso</SelectItem>
                  <SelectItem value="post_use">Post-uso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Operador *</Label><Input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} /></div>
            <div>
              <Label>Orden de trabajo</Label>
              <Select value={workOrderId} onValueChange={setWorkOrderId}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {workOrders.map((w) => (<SelectItem key={w.id} value={w.id}>{w.order_number || w.title}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Maquinaria</Label>
              <Select value={machineryId} onValueChange={setMachineryId}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {machinery.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehículo</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (<SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={captureGps}><MapPin className="h-4 w-4 mr-1" />
              {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : "Capturar ubicación"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-base">Checklist</CardTitle>
            <Badge variant={statusMeta[status].variant}>
              <StatusIcon className="h-3 w-3 mr-1" />{statusMeta[status].label}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((it) => {
              const a = answers[it.id] || { value: "", is_fail: false, observation: "" };
              return (
                <div key={it.id} className={`p-3 rounded-md border ${a.is_fail ? "border-destructive/50 bg-destructive/5" : "border-border"}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium">
                      {it.sort_order}. {it.label}
                      {it.critical && <Badge variant="destructive" className="ml-2 text-[10px]">Crítico</Badge>}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant={!a.is_fail ? "default" : "outline"}
                        onClick={() => setAnswers({ ...answers, [it.id]: { ...a, is_fail: false, value: "OK" } })}>OK</Button>
                      <Button size="sm" variant={a.is_fail ? "destructive" : "outline"}
                        onClick={() => setAnswers({ ...answers, [it.id]: { ...a, is_fail: true, value: "Falla" } })}>Falla</Button>
                    </div>
                  </div>
                  {a.is_fail && (
                    <Textarea placeholder="Describe la falla…" value={a.observation}
                      onChange={(e) => setAnswers({ ...answers, [it.id]: { ...a, observation: e.target.value } })}
                      className="mt-1 text-xs" />
                  )}
                </div>
              );
            })}
            <div>
              <Label>Notas generales</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Firma del operador</CardTitle></CardHeader>
        <CardContent>
          {signature ? (
            <div className="space-y-2">
              <img src={signature} alt="firma" className="max-h-32 border rounded-md bg-white" />
              <Button size="sm" variant="outline" onClick={() => setSignature(null)}>Borrar firma</Button>
            </div>
          ) : (
            <SignaturePad onSave={(dataUrl, name) => { setSignature(dataUrl); setOperatorName(name || operatorName); }} />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={save} disabled={saving || !tplId}>
          {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Guardando…</> : <><ClipboardCheck className="h-4 w-4 mr-1" />Guardar inspección</>}
        </Button>
      </div>
    </div>
  );
}
