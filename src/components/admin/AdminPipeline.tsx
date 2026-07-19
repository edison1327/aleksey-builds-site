import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CalendarClock, DollarSign, Search, Trophy, TrendingUp } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Stage = "new" | "contacted" | "quoted" | "negotiation" | "won" | "lost";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
  crm_stage: Stage;
  crm_value_pen: number | null;
  crm_next_action: string | null;
  crm_next_action_at: string | null;
  crm_notes: string | null;
  crm_order: number;
  crm_stage_updated_at: string | null;
}

const STAGES: { id: Stage; label: string; color: string; accent: string }[] = [
  { id: "new", label: "Nuevo", color: "bg-slate-500/10 border-slate-500/30", accent: "text-slate-600" },
  { id: "contacted", label: "Contactado", color: "bg-blue-500/10 border-blue-500/30", accent: "text-blue-600" },
  { id: "quoted", label: "Cotizado", color: "bg-amber-500/10 border-amber-500/30", accent: "text-amber-600" },
  { id: "negotiation", label: "Negociación", color: "bg-purple-500/10 border-purple-500/30", accent: "text-purple-600" },
  { id: "won", label: "Ganado", color: "bg-emerald-500/10 border-emerald-500/30", accent: "text-emerald-600" },
  { id: "lost", label: "Perdido", color: "bg-red-500/10 border-red-500/30", accent: "text-red-600" },
];

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  const overdue = lead.crm_next_action_at && new Date(lead.crm_next_action_at) < new Date();
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition ${isDragging ? "opacity-30" : ""}`}
      onDoubleClick={() => onOpen(lead)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm truncate flex-1">{lead.name}</p>
        {lead.crm_value_pen != null && (
          <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
            S/ {Number(lead.crm_value_pen).toLocaleString("es-PE")}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
      <p className="text-xs mt-1 line-clamp-2 text-muted-foreground/80">{lead.message}</p>
      {lead.crm_next_action && (
        <div className={`text-xs mt-2 flex items-center gap-1 ${overdue ? "text-red-600" : "text-muted-foreground"}`}>
          <CalendarClock className="h-3 w-3" />
          <span className="truncate">{lead.crm_next_action}</span>
        </div>
      )}
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(lead.created_at), { locale: es, addSuffix: true })}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={(e) => { e.stopPropagation(); onOpen(lead); }}
        >
          Editar
        </Button>
      </div>
    </div>
  );
}

function Column({ stage, leads, onOpen }: { stage: typeof STAGES[number]; leads: Lead[]; onOpen: (l: Lead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = leads.reduce((s, l) => s + Number(l.crm_value_pen ?? 0), 0);

  return (
    <div className="flex flex-col min-w-[280px] w-[280px]">
      <div className={`px-3 py-2 rounded-t-lg border-b-2 ${stage.color}`}>
        <div className="flex items-center justify-between">
          <span className={`font-semibold text-sm ${stage.accent}`}>{stage.label}</span>
          <Badge variant="outline" className="text-xs">{leads.length}</Badge>
        </div>
        {total > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">S/ {total.toLocaleString("es-PE")}</p>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] p-2 space-y-2 rounded-b-lg border border-t-0 bg-muted/20 ${isOver ? "bg-primary/5 ring-2 ring-primary/30" : ""}`}
      >
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Vacío</p>
        ) : (
          leads.map((l) => <LeadCard key={l.id} lead={l} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
}

export default function AdminPipeline() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id,name,email,phone,message,created_at,crm_stage,crm_value_pen,crm_next_action,crm_next_action_at,crm_notes,crm_order,crm_stage_updated_at")
      .order("crm_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return leads;
    const s = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(s) ||
        l.email.toLowerCase().includes(s) ||
        l.message.toLowerCase().includes(s)
    );
  }, [leads, search]);

  const byStage = useMemo(() => {
    const map: Record<Stage, Lead[]> = { new: [], contacted: [], quoted: [], negotiation: [], won: [], lost: [] };
    filtered.forEach((l) => map[l.crm_stage].push(l));
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const pipeline = leads
      .filter((l) => !["won", "lost"].includes(l.crm_stage))
      .reduce((s, l) => s + Number(l.crm_value_pen ?? 0), 0);
    const won = leads.filter((l) => l.crm_stage === "won");
    const wonValue = won.reduce((s, l) => s + Number(l.crm_value_pen ?? 0), 0);
    const total = leads.length;
    const conv = total ? (won.length / total) * 100 : 0;
    return { pipeline, wonValue, wonCount: won.length, conv };
  }, [leads]);

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const leadId = String(e.active.id);
    const newStage = e.over?.id as Stage | undefined;
    if (!newStage) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.crm_stage === newStage) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, crm_stage: newStage } : l)));

    const { error } = await supabase
      .from("contact_messages")
      .update({ crm_stage: newStage })
      .eq("id", leadId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      load();
    } else {
      const stageLabel = STAGES.find((s) => s.id === newStage)?.label ?? newStage;
      toast({ title: "Movido", description: `${lead.name} → ${stageLabel}` });
    }
  };

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setEditForm({
      crm_stage: lead.crm_stage,
      crm_value_pen: lead.crm_value_pen,
      crm_next_action: lead.crm_next_action,
      crm_next_action_at: lead.crm_next_action_at,
      crm_notes: lead.crm_notes,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const rawVal = editForm.crm_value_pen;
    const patch = {
      crm_stage: (editForm.crm_stage ?? editing.crm_stage) as Stage,
      crm_value_pen: rawVal === null || rawVal === undefined || (rawVal as unknown) === "" ? null : Number(rawVal),
      crm_next_action: editForm.crm_next_action || null,
      crm_next_action_at: editForm.crm_next_action_at || null,
      crm_notes: editForm.crm_notes || null,
    };
    const { error } = await supabase.from("contact_messages").update(patch).eq("id", editing.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Actualizado" });
    setEditing(null);
    load();
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pipeline CRM</h1>
          <p className="text-sm text-muted-foreground">Arrastra tarjetas para cambiar de etapa · doble clic para editar</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3 w-3" /> Pipeline activo</div>
          <p className="text-xl font-bold mt-1">S/ {stats.pipeline.toLocaleString("es-PE")}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Trophy className="h-3 w-3" /> Ganados</div>
          <p className="text-xl font-bold mt-1 text-emerald-600">S/ {stats.wonValue.toLocaleString("es-PE")}</p>
          <p className="text-xs text-muted-foreground">{stats.wonCount} deals</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" /> Conversión</div>
          <p className="text-xl font-bold mt-1">{stats.conv.toFixed(1)}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Leads totales</div>
          <p className="text-xl font-bold mt-1">{leads.length}</p>
        </CardContent></Card>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map((s) => (
              <Column key={s.id} stage={s} leads={byStage[s.id]} onOpen={openEdit} />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? (
              <div className="bg-card border rounded-lg p-3 shadow-lg w-[260px] rotate-2">
                <p className="font-medium text-sm">{activeLead.name}</p>
                <p className="text-xs text-muted-foreground">{activeLead.email}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground border rounded p-2 bg-muted/30">
                <p><strong>{editing.email}</strong>{editing.phone ? ` · ${editing.phone}` : ""}</p>
                <p className="mt-1 line-clamp-3">{editing.message}</p>
                {editing.crm_stage_updated_at && (
                  <p className="mt-1 text-[10px]">Etapa desde {format(new Date(editing.crm_stage_updated_at), "PPp", { locale: es })}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Etapa</Label>
                  <Select value={editForm.crm_stage} onValueChange={(v) => setEditForm({ ...editForm, crm_stage: v as Stage })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Valor estimado (S/)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.crm_value_pen ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, crm_value_pen: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Próxima acción</Label>
                <Input
                  value={editForm.crm_next_action ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, crm_next_action: e.target.value })}
                  placeholder="Ej: llamar para confirmar precio"
                />
              </div>
              <div>
                <Label className="text-xs">Fecha próxima acción</Label>
                <Input
                  type="datetime-local"
                  value={editForm.crm_next_action_at ? editForm.crm_next_action_at.slice(0, 16) : ""}
                  onChange={(e) => setEditForm({ ...editForm, crm_next_action_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>
              <div>
                <Label className="text-xs">Notas internas CRM</Label>
                <Textarea
                  rows={3}
                  value={editForm.crm_notes ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, crm_notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
