import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ClipboardCheck, MapPin, User, Calendar, CheckCircle2, PlayCircle, PauseCircle, LogIn, LogOut, WifiOff, Wifi, FileDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { PhotoUploader } from "@/components/operator/PhotoUploader";
import { SignaturePad } from "@/components/operator/SignaturePad";
import { IncidentReporter } from "@/components/operator/IncidentReporter";
import { MaterialsPanel } from "@/components/operator/MaterialsPanel";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { enqueue, initOfflineSync } from "@/lib/offlineQueue";
import { exportWorkOrderSummaryPdf } from "@/lib/pdfExport";

type ChecklistItem = { id: string; label: string; done: boolean };
type WO = {
  id: string; code: string; title: string; description: string | null;
  customer_name: string | null; customer_email: string | null; customer_phone: string | null; site_address: string | null;
  status: string; priority: string; checklist: ChecklistItem[]; notes: string | null;
  scheduled_start: string | null; scheduled_end: string | null;
  estimated_cost: number | null; actual_cost: number | null;
  client_signature_url: string | null; client_signature_name: string | null; client_signature_at: string | null;
};


const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", in_progress: "En curso", on_hold: "En pausa",
  completed: "Completada", cancelled: "Cancelada",
};

async function getGPS(): Promise<{ lat: number | null; lng: number | null }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

export default function OperatorWorkOrders() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [openEntries, setOpenEntries] = useState<Record<string, string>>({}); // wo_id -> time_entry.id
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    if (!isLoading && !user) navigate("/admin/login");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    initOfflineSync();
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);


  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("work_orders")
      .select("*")
      .eq("assigned_to", user.id)
      .neq("status", "cancelled")
      .order("scheduled_start", { ascending: true, nullsFirst: false });
    setItems((data as any) || []);

    // Employee lookup
    const { data: emp } = await supabase.from("employees").select("id").eq("user_id", user.id).maybeSingle();
    setEmployeeId(emp?.id || null);

    if (emp?.id) {
      const { data: entries } = await supabase
        .from("time_entries")
        .select("id, work_order_id")
        .eq("employee_id", emp.id)
        .is("check_out", null);
      const map: Record<string, string> = {};
      (entries || []).forEach((e: any) => { if (e.work_order_id) map[e.work_order_id] = e.id; });
      setOpenEntries(map);
    }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const toggleTask = async (wo: WO, taskId: string) => {
    const next = (wo.checklist || []).map((t) => t.id === taskId ? { ...t, done: !t.done } : t);
    setItems((prev) => prev.map((w) => w.id === wo.id ? { ...w, checklist: next } : w));
    if (!navigator.onLine) {
      enqueue({ table: "work_orders", action: "update", payload: { checklist: next }, match: { id: wo.id }, label: `Checklist OT ${wo.code}` });
      return;
    }
    const { error } = await supabase.from("work_orders").update({ checklist: next }).eq("id", wo.id);
    if (error) { toast.error(error.message); load(); }
  };

  const changeStatus = async (wo: WO, status: string) => {
    if (status === "completed" && !wo.client_signature_url) {
      toast.error("Se requiere firma del cliente para completar");
      return;
    }
    const patch: any = { status };
    if (status === "in_progress") patch.started_at = new Date().toISOString();
    if (status === "completed") {
      patch.completed_at = new Date().toISOString();
      const { lat, lng } = await getGPS();
      patch.completion_lat = lat;
      patch.completion_lng = lng;
    }
    if (!navigator.onLine) {
      enqueue({ table: "work_orders", action: "update", payload: patch, match: { id: wo.id }, label: `Estado OT ${wo.code}: ${status}` });
      setItems((prev) => prev.map((w) => w.id === wo.id ? { ...w, ...patch } : w));
      toast.info("Sin conexión: cambio en cola");
      return;
    }
    const { error } = await supabase.from("work_orders").update(patch).eq("id", wo.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estado actualizado");
    load();
  };


  const checkIn = async (wo: WO) => {
    if (!employeeId) { toast.error("Tu usuario no tiene ficha de empleado"); return; }
    const { lat, lng } = await getGPS();
    const { data, error } = await supabase.from("time_entries").insert({
      employee_id: employeeId,
      work_order_id: wo.id,
      entry_date: new Date().toISOString().slice(0, 10),
      check_in: new Date().toISOString(),
      check_in_lat: lat, check_in_lng: lng,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    setOpenEntries({ ...openEntries, [wo.id]: data.id });
    toast.success(lat ? "Check-in con ubicación" : "Check-in sin GPS");
    if (wo.status === "pending") changeStatus(wo, "in_progress");
  };

  const checkOut = async (wo: WO) => {
    const entryId = openEntries[wo.id];
    if (!entryId) return;
    const { lat, lng } = await getGPS();
    const { error } = await supabase.from("time_entries").update({
      check_out: new Date().toISOString(),
      check_out_lat: lat, check_out_lng: lng,
    }).eq("id", entryId);
    if (error) { toast.error(error.message); return; }
    const next = { ...openEntries }; delete next[wo.id];
    setOpenEntries(next);
    toast.success("Check-out registrado");
  };

  const saveNote = async (wo: WO) => {
    const note = notes[wo.id];
    if (!note) return;
    const combined = wo.notes ? `${wo.notes}\n\n[${new Date().toLocaleString("es")}] ${note}` : `[${new Date().toLocaleString("es")}] ${note}`;
    if (!navigator.onLine) {
      enqueue({ table: "work_orders", action: "update", payload: { notes: combined }, match: { id: wo.id }, label: `Nota OT ${wo.code}` });
      setItems((prev) => prev.map((w) => w.id === wo.id ? { ...w, notes: combined } : w));
      setNotes({ ...notes, [wo.id]: "" });
      toast.info("Sin conexión: nota en cola");
      return;
    }
    const { error } = await supabase.from("work_orders").update({ notes: combined }).eq("id", wo.id);
    if (error) { toast.error(error.message); return; }
    setNotes({ ...notes, [wo.id]: "" });
    toast.success("Nota agregada");
    load();
  };

  const exportSummary = async (wo: WO) => {
    try {
      toast.info("Generando PDF…");
      const [incR, matR, phR, teR] = await Promise.all([
        supabase.from("work_order_incidents" as any).select("*").eq("work_order_id", wo.id).order("created_at", { ascending: false }),
        supabase.from("work_order_material_reservations" as any).select("*, stock_items(name,unit)").eq("work_order_id", wo.id),
        supabase.from("work_order_photos").select("kind").eq("work_order_id", wo.id),
        employeeId
          ? supabase.from("time_entries").select("hours").eq("work_order_id", wo.id).eq("employee_id", employeeId)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const photos = (phR.data as any[]) || [];
      const before = photos.filter((p) => p.kind === "before").length;
      const after = photos.filter((p) => p.kind === "after").length;
      const hours = ((teR as any).data || []).reduce((a: number, t: any) => a + (Number(t.hours) || 0), 0);
      await exportWorkOrderSummaryPdf({
        code: wo.code, title: wo.title, description: wo.description,
        customer_name: wo.customer_name, customer_email: wo.customer_email, customer_phone: wo.customer_phone,
        site_address: wo.site_address, status: wo.status, priority: wo.priority,
        scheduled_start: wo.scheduled_start, scheduled_end: wo.scheduled_end,
        estimated_cost: wo.estimated_cost, actual_cost: wo.actual_cost,
        checklist: wo.checklist || [], notes: wo.notes,
        hours_total: hours, photos_before: before, photos_after: after,
        incidents: ((incR.data as any[]) || []).map((i) => ({
          title: i.title, severity: i.severity, status: i.status, category: i.category, description: i.description, created_at: i.created_at,
        })),
        materials: ((matR.data as any[]) || []).map((m) => ({
          name: m.stock_items?.name || "—", quantity: Number(m.quantity),
          unit: m.stock_items?.unit || null, status: m.status, notes: m.notes,
        })),
        client_signature_url: wo.client_signature_url,
        client_signature_name: wo.client_signature_name,
        client_signature_at: wo.client_signature_at,
      });
    } catch (e: any) {
      toast.error(e.message || "Error generando PDF");
    }
  };


  const saveSignature = async (wo: WO, dataUrl: string, name: string) => {
    if (!user) return;
    try {
      // Convert data URL to Blob
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${user.id}/${wo.id}/signature/${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("work-order-media")
        .upload(path, blob, { contentType: "image/png", upsert: true });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage
        .from("work-order-media")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const { error } = await supabase.from("work_orders").update({
        client_signature_url: signed?.signedUrl,
        client_signature_name: name,
        client_signature_at: new Date().toISOString(),
      }).eq("id", wo.id);
      if (error) throw error;
      await supabase.from("work_order_photos").insert({
        work_order_id: wo.id, kind: "signature", storage_path: path, uploaded_by: user.id,
      });
      toast.success("Firma capturada");
      load();
    } catch (e: any) {
      toast.error(e.message || "Error guardando firma");
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      <Helmet><title>Mis órdenes de trabajo</title></Helmet>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <h1 className="font-heading font-bold">Mis OT</h1>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <OfflineIndicator />
          {online ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-amber-600" />}
          <Link to="/" className="text-muted-foreground">Salir</Link>
        </div>

      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando…</p>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <p>Sin órdenes asignadas.</p>
          </CardContent></Card>
        ) : items.map((wo) => {
          const list = Array.isArray(wo.checklist) ? wo.checklist : [];
          const done = list.filter((t) => t.done).length;
          const progress = list.length ? Math.round((done / list.length) * 100) : 0;
          const openEntry = openEntries[wo.id];
          return (
            <Card key={wo.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{wo.code}</p>
                    <CardTitle className="text-base">{wo.title}</CardTitle>
                  </div>
                  <Badge variant={wo.priority === "urgent" ? "destructive" : "outline"}>
                    {wo.priority}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                  {wo.customer_name && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {wo.customer_name}</span>}
                  {wo.site_address && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(wo.site_address)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline">
                      <MapPin className="h-3 w-3" /> {wo.site_address}
                    </a>
                  )}
                  {wo.scheduled_start && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(wo.scheduled_start), "d MMM HH:mm", { locale: es })}</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    wo.status === "completed" ? "bg-emerald-500 text-white" :
                    wo.status === "in_progress" ? "bg-blue-500 text-white" :
                    wo.status === "on_hold" ? "bg-amber-500 text-white" :
                    "bg-primary/10 text-primary"
                  )}>{STATUS_LABEL[wo.status]}</Badge>
                  {openEntry && <Badge variant="outline" className="text-emerald-600 border-emerald-600">Check-in activo</Badge>}
                </div>

                {/* Check-in/out */}
                <div className="flex gap-2">
                  {!openEntry ? (
                    <Button size="sm" variant="secondary" onClick={() => checkIn(wo)} disabled={wo.status === "completed"}>
                      <LogIn className="h-4 w-4 mr-1" /> Check-in (GPS)
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => checkOut(wo)}>
                      <LogOut className="h-4 w-4 mr-1" /> Check-out
                    </Button>
                  )}
                </div>

                {list.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{done}/{list.length} tareas</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="space-y-1">
                      {list.map((t) => (
                        <label key={t.id} className="flex items-start gap-2 p-2 rounded-md border border-border cursor-pointer">
                          <input type="checkbox" checked={t.done} onChange={() => toggleTask(wo, t.id)} className="mt-0.5 h-4 w-4" />
                          <span className={cn("text-sm flex-1", t.done && "line-through text-muted-foreground")}>{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {wo.description && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Descripción</p>
                    <p className="text-sm whitespace-pre-wrap">{wo.description}</p>
                  </div>
                )}

                {/* Photo evidence */}
                <PhotoUploader workOrderId={wo.id} userId={user.id} kind="before" label="Fotos antes" />
                <PhotoUploader workOrderId={wo.id} userId={user.id} kind="after" label="Fotos después" />

                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Agregar nota</p>
                  <Textarea rows={2} value={notes[wo.id] || ""} onChange={(e) => setNotes({ ...notes, [wo.id]: e.target.value })} />
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => saveNote(wo)}>Guardar nota</Button>
                </div>

                {/* Client signature */}
                {wo.status !== "completed" && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Firma del cliente</p>
                    {wo.client_signature_url ? (
                      <div className="rounded-md border border-border p-3 bg-muted/30">
                        <img src={wo.client_signature_url} alt="Firma" className="max-h-24" />
                        <p className="text-xs mt-1">Firmado por <strong>{wo.client_signature_name}</strong></p>
                      </div>
                    ) : (
                      <SignaturePad onSave={(dataUrl, name) => saveSignature(wo, dataUrl, name)} />
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {wo.status !== "in_progress" && wo.status !== "completed" && (
                    <Button size="sm" onClick={() => changeStatus(wo, "in_progress")}>
                      <PlayCircle className="h-4 w-4 mr-1" /> Iniciar
                    </Button>
                  )}
                  {wo.status === "in_progress" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => changeStatus(wo, "on_hold")}>
                        <PauseCircle className="h-4 w-4 mr-1" /> Pausar
                      </Button>
                      <Button size="sm" onClick={() => changeStatus(wo, "completed")} disabled={!wo.client_signature_url}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Completar
                      </Button>
                    </>
                  )}
                  {wo.status === "on_hold" && (
                    <Button size="sm" onClick={() => changeStatus(wo, "in_progress")}>
                      <PlayCircle className="h-4 w-4 mr-1" /> Reanudar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </main>
    </div>
  );
}
