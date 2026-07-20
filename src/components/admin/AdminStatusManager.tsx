import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  operational: "Operacional",
  degraded: "Rendimiento degradado",
  partial_outage: "Interrupción parcial",
  major_outage: "Interrupción total",
  maintenance: "En mantenimiento",
};

const STATUS_COLOR: Record<string, string> = {
  operational: "bg-green-500",
  degraded: "bg-yellow-500",
  partial_outage: "bg-orange-500",
  major_outage: "bg-red-500",
  maintenance: "bg-blue-500",
};

export default function AdminStatusManager() {
  const [components, setComponents] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [newCompOpen, setNewCompOpen] = useState(false);
  const [newIncOpen, setNewIncOpen] = useState(false);
  const [compForm, setCompForm] = useState({ name: "", description: "", status: "operational" });
  const [incForm, setIncForm] = useState({ title: "", description: "", severity: "minor", status: "investigating" });

  const load = async () => {
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from("status_components").select("*").order("display_order"),
      supabase.from("status_incidents").select("*").order("created_at", { ascending: false }),
    ]);
    setComponents(c || []);
    setIncidents(i || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    load();
  }, []);

  const updateCompStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("status_components").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Estado actualizado");
      load();
    }
  };

  const deleteComp = async (id: string) => {
    if (!confirm("¿Eliminar componente?")) return;
    await supabase.from("status_components").delete().eq("id", id);
    load();
  };

  const createComp = async () => {
    if (!compForm.name.trim()) return;
    const { error } = await supabase.from("status_components").insert(compForm);
    if (error) return toast.error(error.message);
    setCompForm({ name: "", description: "", status: "operational" });
    setNewCompOpen(false);
    load();
  };

  const createIncident = async () => {
    if (!incForm.title.trim()) return;
    const { error } = await supabase.from("status_incidents").insert({ ...incForm, created_by: uid });
    if (error) return toast.error(error.message);
    setIncForm({ title: "", description: "", severity: "minor", status: "investigating" });
    setNewIncOpen(false);
    load();
  };

  const resolveIncident = async (id: string) => {
    await supabase.from("status_incidents").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portal de estado</h2>
          <p className="text-sm text-muted-foreground">Gestiona componentes e incidentes públicos</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/estado" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" /> Ver portal público
          </a>
        </Button>
      </div>

      <Tabs defaultValue="components">
        <TabsList>
          <TabsTrigger value="components">Componentes ({components.length})</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes ({incidents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-3">
          <Dialog open={newCompOpen} onOpenChange={setNewCompOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nuevo componente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo componente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nombre (ej: Sitio web)" value={compForm.name} onChange={(e) => setCompForm({ ...compForm, name: e.target.value })} />
                <Textarea placeholder="Descripción" value={compForm.description} onChange={(e) => setCompForm({ ...compForm, description: e.target.value })} />
                <Select value={compForm.status} onValueChange={(v) => setCompForm({ ...compForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter><Button onClick={createComp}>Crear</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {components.map((c) => (
              <Card key={c.id} className="p-4 flex items-center gap-4">
                <span className={`h-3 w-3 rounded-full ${STATUS_COLOR[c.status]}`} />
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                </div>
                <Select value={c.status} onValueChange={(v) => updateCompStatus(c.id, v)}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" onClick={() => deleteComp(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            ))}
            {components.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin componentes</p>}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-3">
          <Dialog open={newIncOpen} onOpenChange={setNewIncOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nuevo incidente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo incidente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Título" value={incForm.title} onChange={(e) => setIncForm({ ...incForm, title: e.target.value })} />
                <Textarea placeholder="Descripción" value={incForm.description} onChange={(e) => setIncForm({ ...incForm, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={incForm.severity} onValueChange={(v) => setIncForm({ ...incForm, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Menor</SelectItem>
                      <SelectItem value="major">Mayor</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={incForm.status} onValueChange={(v) => setIncForm({ ...incForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investigating">Investigando</SelectItem>
                      <SelectItem value="identified">Identificado</SelectItem>
                      <SelectItem value="monitoring">Monitoreando</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={createIncident}>Crear</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {incidents.map((i) => (
              <Card key={i.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={i.status === "resolved" ? "outline" : "destructive"}>{i.status}</Badge>
                      <Badge variant="secondary">{i.severity}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(i.created_at), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                    <div className="font-medium">{i.title}</div>
                    {i.description && <p className="text-sm text-muted-foreground">{i.description}</p>}
                  </div>
                  {i.status !== "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => resolveIncident(i.id)}>Resolver</Button>
                  )}
                </div>
              </Card>
            ))}
            {incidents.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin incidentes</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
