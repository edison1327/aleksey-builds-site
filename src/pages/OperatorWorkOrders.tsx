import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ClipboardCheck, MapPin, User, Calendar, CheckCircle2, PlayCircle, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";

type ChecklistItem = { id: string; label: string; done: boolean };
type WO = {
  id: string; code: string; title: string; description: string | null;
  customer_name: string | null; customer_phone: string | null; site_address: string | null;
  status: string; priority: string; checklist: ChecklistItem[]; notes: string | null;
  scheduled_start: string | null; scheduled_end: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", in_progress: "En curso", on_hold: "En pausa",
  completed: "Completada", cancelled: "Cancelada",
};

export default function OperatorWorkOrders() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && !user) navigate("/admin/login");
  }, [user, isLoading, navigate]);

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
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const toggleTask = async (wo: WO, taskId: string) => {
    const next = (wo.checklist || []).map((t) => t.id === taskId ? { ...t, done: !t.done } : t);
    setItems((prev) => prev.map((w) => w.id === wo.id ? { ...w, checklist: next } : w));
    const { error } = await supabase.from("work_orders").update({ checklist: next }).eq("id", wo.id);
    if (error) { toast.error(error.message); load(); }
  };

  const changeStatus = async (wo: WO, status: string) => {
    const patch: any = { status };
    if (status === "in_progress") patch.started_at = new Date().toISOString();
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("work_orders").update(patch).eq("id", wo.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estado actualizado");
    load();
  };

  const saveNote = async (wo: WO) => {
    const note = notes[wo.id];
    if (!note) return;
    const combined = wo.notes ? `${wo.notes}\n\n[${new Date().toLocaleString("es")}] ${note}` : `[${new Date().toLocaleString("es")}] ${note}`;
    const { error } = await supabase.from("work_orders").update({ notes: combined }).eq("id", wo.id);
    if (error) { toast.error(error.message); return; }
    setNotes({ ...notes, [wo.id]: "" });
    toast.success("Nota agregada");
    load();
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
        <Link to="/" className="text-xs text-muted-foreground">Salir</Link>
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
                  {wo.site_address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {wo.site_address}</span>}
                  {wo.scheduled_start && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(wo.scheduled_start), "d MMM HH:mm", { locale: es })}</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge className={cn(
                  wo.status === "completed" ? "bg-emerald-500 text-white" :
                  wo.status === "in_progress" ? "bg-blue-500 text-white" :
                  wo.status === "on_hold" ? "bg-amber-500 text-white" :
                  "bg-primary/10 text-primary"
                )}>{STATUS_LABEL[wo.status]}</Badge>

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

                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Agregar nota</p>
                  <Textarea rows={2} value={notes[wo.id] || ""} onChange={(e) => setNotes({ ...notes, [wo.id]: e.target.value })} />
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => saveNote(wo)}>Guardar nota</Button>
                </div>

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
                      <Button size="sm" onClick={() => changeStatus(wo, "completed")}>
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
