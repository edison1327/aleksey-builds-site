import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Loader2 } from "lucide-react";

interface Props {
  messageId: string;
  customerName: string;
  customerEmail: string;
  defaultType?: "machinery" | "vehicle";
  defaultEquipmentName?: string;
  onApproved?: () => void;
}

interface Opt { id: string; name: string; }

const ApproveBookingDialog = ({ messageId, customerName, customerEmail, defaultType, defaultEquipmentName, onApproved }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [machinery, setMachinery] = useState<Opt[]>([]);
  const [vehicles, setVehicles] = useState<Opt[]>([]);
  const [form, setForm] = useState({
    equipment_type: (defaultType || "machinery") as "machinery" | "vehicle",
    equipment_id: "",
    start_date: "",
    end_date: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      supabase.from("machinery").select("id, name").order("name"),
      supabase.from("vehicles").select("id, name").order("name"),
    ]).then(([m, v]) => {
      const mList = (m.data || []) as Opt[];
      const vList = (v.data || []) as Opt[];
      setMachinery(mList);
      setVehicles(vList);
      // Try to auto-match by name
      if (defaultEquipmentName) {
        const list = (defaultType === "vehicle" ? vList : mList);
        const found = list.find((x) => defaultEquipmentName.toLowerCase().includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(defaultEquipmentName.toLowerCase()));
        if (found) setForm((f) => ({ ...f, equipment_id: found.id }));
      }
      setLoading(false);
    });
  }, [open, defaultType, defaultEquipmentName]);

  const submit = async () => {
    if (!form.equipment_id || !form.start_date || !form.end_date) {
      toast({ title: "Faltan datos", description: "Selecciona equipo y fechas", variant: "destructive" });
      return;
    }
    if (form.end_date < form.start_date) {
      toast({ title: "Rango inválido", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error: bookErr } = await (supabase as any).from("equipment_bookings").insert({
      equipment_type: form.equipment_type,
      equipment_id: form.equipment_id,
      start_date: form.start_date,
      end_date: form.end_date,
      status: "reserved",
      customer_name: customerName,
      customer_email: customerEmail,
      notes: form.notes || `Aprobado desde solicitud ${messageId.slice(0, 8)}`,
    });
    if (bookErr) {
      setSubmitting(false);
      toast({ title: "Error al crear reserva", description: bookErr.message, variant: "destructive" });
      return;
    }
    await supabase.from("contact_messages").update({ status: "responded" }).eq("id", messageId);
    setSubmitting(false);
    setOpen(false);
    toast({ title: "Reserva creada", description: "Las fechas quedaron bloqueadas en el calendario." });
    onApproved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-green-600 hover:bg-green-700">
          <CalendarCheck className="h-4 w-4 mr-2" /> Aprobar y bloquear fechas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Aprobar solicitud y reservar</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Cliente: <strong>{customerName}</strong> · {customerEmail}</p>
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
            <div><Label>Notas (opcional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
              Confirmar reserva
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApproveBookingDialog;
