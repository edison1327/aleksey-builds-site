import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Booking {
  id: string;
  equipment_type: "machinery" | "vehicle";
  equipment_id: string;
  start_date: string;
  end_date: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  notes: string | null;
  created_at: string;
}

interface EquipmentOpt { id: string; name: string; }

const AdminBookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [machinery, setMachinery] = useState<EquipmentOpt[]>([]);
  const [vehicles, setVehicles] = useState<EquipmentOpt[]>([]);
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState({
    equipment_type: "machinery" as "machinery" | "vehicle",
    equipment_id: "",
    start_date: "",
    end_date: "",
    status: "reserved",
    customer_name: "",
    customer_email: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [b, m, v] = await Promise.all([
      (supabase as any).from("equipment_bookings").select("*").order("start_date", { ascending: false }),
      supabase.from("machinery").select("id, name").order("name"),
      supabase.from("vehicles").select("id, name").order("name"),
    ]);
    setBookings(((b.data || []) as Booking[]));
    setMachinery((m.data || []) as EquipmentOpt[]);
    setVehicles((v.data || []) as EquipmentOpt[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const nameOf = (b: Booking) => {
    const list = b.equipment_type === "machinery" ? machinery : vehicles;
    return list.find((x) => x.id === b.equipment_id)?.name || "—";
  };

  const submit = async () => {
    if (!form.equipment_id || !form.start_date || !form.end_date) {
      toast({ title: "Faltan datos", variant: "destructive" });
      return;
    }
    if (form.end_date < form.start_date) {
      toast({ title: "Rango inválido", description: "Fin debe ser >= inicio", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any).from("equipment_bookings").insert(form);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reserva creada" });
    setOpen(false);
    setForm({ ...form, equipment_id: "", start_date: "", end_date: "", customer_name: "", customer_email: "", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar reserva?")) return;
    await (supabase as any).from("equipment_bookings").delete().eq("id", id);
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await (supabase as any).from("equipment_bookings").update({ status }).eq("id", id);
    load();
  };

  const filtered = bookings.filter((b) => filterStatus === "all" || b.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><CalendarRange className="h-6 w-6" /> Reservas / Calendario</h2>
          <p className="text-sm text-muted-foreground">Bloquea fechas de maquinaria y vehículos para que se muestren ocupadas en el sitio.</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="reserved">Reservado</SelectItem>
              <SelectItem value="blocked">Bloqueado</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva reserva</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva reserva</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.equipment_type} onValueChange={(v: any) => setForm({ ...form, equipment_type: v, equipment_id: "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="machinery">Maquinaria</SelectItem>
                        <SelectItem value="vehicle">Vehículo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Equipo</Label>
                    <Select value={form.equipment_id} onValueChange={(v) => setForm({ ...form, equipment_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                      <SelectContent>
                        {(form.equipment_type === "machinery" ? machinery : vehicles).map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Inicio</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                  <div><Label>Fin</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reserved">Reservado (cliente)</SelectItem>
                      <SelectItem value="blocked">Bloqueado (mantenimiento)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Cliente</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
                </div>
                <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button className="w-full" onClick={submit}>Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-3">
          {filtered.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">Sin reservas.</CardContent></Card>}
          {filtered.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base">{nameOf(b)} <Badge variant="outline" className="ml-2 text-[10px]">{b.equipment_type}</Badge></CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(b.start_date), "PP", { locale: es })} → {format(new Date(b.end_date), "PP", { locale: es })}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={b.status} onValueChange={(v) => setStatus(b.id, v)}>
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reserved">Reservado</SelectItem>
                        <SelectItem value="blocked">Bloqueado</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              {(b.customer_name || b.notes) && (
                <CardContent className="text-sm pt-0">
                  {b.customer_name && <p><strong>{b.customer_name}</strong> {b.customer_email && `· ${b.customer_email}`}</p>}
                  {b.notes && <p className="text-muted-foreground text-xs mt-1">{b.notes}</p>}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
