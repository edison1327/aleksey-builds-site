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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Wrench, History, Plus, Truck, Car } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Equip = {
  id: string;
  name: string;
  type: "machinery" | "vehicle";
  usage_hours: number | null;
  service_interval_hours: number | null;
  next_service_hours: number | null;
};

type ServiceLog = {
  id: string;
  equipment_type: string;
  equipment_id: string;
  service_type: string;
  hours_at_service: number | null;
  hours_added: number | null;
  cost: number | null;
  notes: string | null;
  performed_by: string | null;
  performed_at: string;
};

export default function AdminInventory() {
  const [equipment, setEquipment] = useState<Equip[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "alert" | "machinery" | "vehicle">("all");

  // dialogs
  const [selected, setSelected] = useState<Equip | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [logForm, setLogForm] = useState({
    service_type: "Mantenimiento preventivo",
    hours_added: "",
    cost: "",
    notes: "",
    performed_by: "",
  });
  const [settingsForm, setSettingsForm] = useState({
    usage_hours: "",
    service_interval_hours: "",
    next_service_hours: "",
  });

  const load = async () => {
    setLoading(true);
    const [m, v, l] = await Promise.all([
      supabase.from("machinery").select("id,name,usage_hours,service_interval_hours,next_service_hours").eq("is_active", true),
      supabase.from("vehicles").select("id,name,usage_hours,service_interval_hours,next_service_hours").eq("is_active", true),
      supabase.from("equipment_service_log").select("*").order("performed_at", { ascending: false }).limit(200),
    ]);
    const list: Equip[] = [
      ...((m.data || []) as any[]).map((x) => ({ ...x, type: "machinery" as const })),
      ...((v.data || []) as any[]).map((x) => ({ ...x, type: "vehicle" as const })),
    ];
    setEquipment(list);
    if (l.data) setLogs(l.data as ServiceLog[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const needsService = (e: Equip) => {
    if (!e.next_service_hours || e.usage_hours == null) return false;
    return Number(e.usage_hours) >= Number(e.next_service_hours);
  };
  const approaching = (e: Equip) => {
    if (!e.next_service_hours || e.usage_hours == null) return false;
    const diff = Number(e.next_service_hours) - Number(e.usage_hours);
    return diff > 0 && diff <= 20;
  };

  const filtered = useMemo(() => {
    return equipment.filter((e) => {
      if (filter === "alert") return needsService(e) || approaching(e);
      if (filter === "machinery" || filter === "vehicle") return e.type === filter;
      return true;
    });
  }, [equipment, filter]);

  const alertsCount = equipment.filter((e) => needsService(e) || approaching(e)).length;

  const openLog = (e: Equip) => {
    setSelected(e);
    setLogForm({ service_type: "Mantenimiento preventivo", hours_added: "", cost: "", notes: "", performed_by: "" });
    setLogOpen(true);
  };

  const openSettings = (e: Equip) => {
    setSelected(e);
    setSettingsForm({
      usage_hours: String(e.usage_hours ?? ""),
      service_interval_hours: String(e.service_interval_hours ?? ""),
      next_service_hours: String(e.next_service_hours ?? ""),
    });
    setSettingsOpen(true);
  };

  const saveLog = async () => {
    if (!selected) return;
    const added = parseFloat(logForm.hours_added || "0") || 0;
    const newUsage = Number(selected.usage_hours || 0) + added;
    const { error } = await supabase.from("equipment_service_log").insert({
      equipment_type: selected.type,
      equipment_id: selected.id,
      service_type: logForm.service_type,
      hours_at_service: newUsage,
      hours_added: added,
      cost: logForm.cost ? parseFloat(logForm.cost) : null,
      notes: logForm.notes || null,
      performed_by: logForm.performed_by || null,
    });
    if (error) { toast.error(error.message); return; }

    // update equipment usage & next service
    const nextService = selected.service_interval_hours
      ? newUsage + Number(selected.service_interval_hours)
      : selected.next_service_hours;
    const table = selected.type === "machinery" ? "machinery" : "vehicles";
    await supabase.from(table).update({
      usage_hours: newUsage,
      next_service_hours: nextService,
    }).eq("id", selected.id);

    toast.success("Servicio registrado");
    setLogOpen(false);
    load();
  };

  const saveSettings = async () => {
    if (!selected) return;
    const table = selected.type === "machinery" ? "machinery" : "vehicles";
    const patch = {
      usage_hours: settingsForm.usage_hours ? parseFloat(settingsForm.usage_hours) : 0,
      service_interval_hours: settingsForm.service_interval_hours ? parseFloat(settingsForm.service_interval_hours) : null,
      next_service_hours: settingsForm.next_service_hours ? parseFloat(settingsForm.next_service_hours) : null,
    };
    const { error } = await supabase.from(table).update(patch).eq("id", selected.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardado");
    setSettingsOpen(false);
    load();
  };

  const equipmentLogs = (e: Equip) => logs.filter((l) => l.equipment_type === e.type && l.equipment_id === e.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" /> Inventario & Mantenimiento
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Horas de uso, próximas revisiones e historial por equipo.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {alertsCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {alertsCount} alerta(s)
              </Badge>
            )}
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="alert">Con alertas</SelectItem>
                <SelectItem value="machinery">Maquinaria</SelectItem>
                <SelectItem value="vehicle">Vehículos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Horas uso</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Próx. servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Cargando…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Sin equipos</TableCell></TableRow>
                ) : filtered.map((e) => {
                  const overdue = needsService(e);
                  const near = approaching(e);
                  const remaining = e.next_service_hours && e.usage_hours != null
                    ? Number(e.next_service_hours) - Number(e.usage_hours)
                    : null;
                  return (
                    <TableRow key={`${e.type}-${e.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {e.type === "machinery" ? <Truck className="h-4 w-4 text-muted-foreground" /> : <Car className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{e.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{Number(e.usage_hours || 0).toFixed(1)} h</TableCell>
                      <TableCell>{e.service_interval_hours ? `${e.service_interval_hours} h` : "—"}</TableCell>
                      <TableCell>{e.next_service_hours ? `${e.next_service_hours} h` : "—"}</TableCell>
                      <TableCell>
                        {overdue ? (
                          <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Servicio vencido</Badge>
                        ) : near ? (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1">
                            <AlertTriangle className="h-3 w-3" /> Faltan {remaining?.toFixed(1)} h
                          </Badge>
                        ) : (
                          <Badge variant="outline">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => openSettings(e)}>Configurar</Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelected(e); setHistoryOpen(true); }}>
                          <History className="h-3 w-3 mr-1" /> Historial
                        </Button>
                        <Button size="sm" onClick={() => openLog(e)}>
                          <Plus className="h-3 w-3 mr-1" /> Servicio
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Log service */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar servicio — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo de servicio</Label>
              <Input value={logForm.service_type} onChange={(e) => setLogForm({ ...logForm, service_type: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Horas trabajadas desde último registro</Label>
                <Input type="number" step="0.1" value={logForm.hours_added} onChange={(e) => setLogForm({ ...logForm, hours_added: e.target.value })} />
              </div>
              <div>
                <Label>Costo</Label>
                <Input type="number" step="0.01" value={logForm.cost} onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Realizado por</Label>
              <Input value={logForm.performed_by} onChange={(e) => setLogForm({ ...logForm, performed_by: e.target.value })} />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea rows={3} value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLogOpen(false)}>Cancelar</Button>
            <Button onClick={saveLog}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Horas de uso actuales</Label>
              <Input type="number" step="0.1" value={settingsForm.usage_hours} onChange={(e) => setSettingsForm({ ...settingsForm, usage_hours: e.target.value })} />
            </div>
            <div>
              <Label>Intervalo entre servicios (horas)</Label>
              <Input type="number" step="0.1" value={settingsForm.service_interval_hours} onChange={(e) => setSettingsForm({ ...settingsForm, service_interval_hours: e.target.value })} />
            </div>
            <div>
              <Label>Próximo servicio a las (horas)</Label>
              <Input type="number" step="0.1" value={settingsForm.next_service_hours} onChange={(e) => setSettingsForm({ ...settingsForm, next_service_hours: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
            <Button onClick={saveSettings}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {selected && equipmentLogs(selected).length === 0 && (
              <p className="text-sm text-muted-foreground">Sin registros aún.</p>
            )}
            {selected && equipmentLogs(selected).map((l) => (
              <div key={l.id} className="border border-border rounded-md p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{l.service_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(l.performed_at), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                  {l.hours_at_service != null && <span>@ {l.hours_at_service} h</span>}
                  {l.hours_added ? <span>+{l.hours_added} h</span> : null}
                  {l.cost != null && <span>Costo: {l.cost}</span>}
                  {l.performed_by && <span>Por: {l.performed_by}</span>}
                </div>
                {l.notes && <p className="text-xs mt-1">{l.notes}</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
