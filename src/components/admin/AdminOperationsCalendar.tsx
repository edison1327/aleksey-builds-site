import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Wrench, CalendarCheck, Plus, AlertTriangle, FileDown, CalendarPlus } from "lucide-react";
import {
  addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isSameDay,
  isWithinInterval, parseISO, startOfMonth, startOfWeek, subMonths, subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportCalendarPdf, type CalendarPdfItem } from "@/lib/pdfExport";
import { enqueue } from "@/lib/offlineQueue";

type Booking = {
  id: string;
  equipment_type: "machinery" | "vehicle";
  equipment_id: string;
  start_date: string;
  end_date: string;
  status: string;
  customer_name: string | null;
};

type Maintenance = {
  id: string;
  equipment_type: "machinery" | "vehicle";
  equipment_id: string;
  start_date: string;
  end_date: string;
  title: string;
  notes: string | null;
  status: string;
};

type Equip = { id: string; name: string; type: "machinery" | "vehicle" };

const overlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  parseISO(aStart) <= parseISO(bEnd) && parseISO(aEnd) >= parseISO(bStart);

export default function AdminOperationsCalendar() {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [equipment, setEquipment] = useState<Equip[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState<Date | null>(null);

  // maintenance dialog
  const [mOpen, setMOpen] = useState(false);
  const [mForm, setMForm] = useState({
    equipment_type: "machinery" as "machinery" | "vehicle",
    equipment_id: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    title: "",
    notes: "",
  });

  // booking dialog
  const [bOpen, setBOpen] = useState(false);
  const [bForm, setBForm] = useState({
    equipment_type: "machinery" as "machinery" | "vehicle",
    equipment_id: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    customer_name: "",
    customer_email: "",
    notes: "",
    status: "reserved",
  });

  const load = async () => {
    setLoading(true);
    const [b, m, mach, veh] = await Promise.all([
      supabase.from("equipment_bookings").select("id,equipment_type,equipment_id,start_date,end_date,status,customer_name").in("status", ["reserved", "blocked", "completed"]),
      supabase.from("equipment_maintenance").select("*").neq("status", "cancelled"),
      supabase.from("machinery").select("id,name").eq("is_active", true),
      supabase.from("vehicles").select("id,name").eq("is_active", true),
    ]);
    if (b.data) setBookings(b.data as Booking[]);
    if (m.data) setMaintenance(m.data as Maintenance[]);
    const list: Equip[] = [
      ...((mach.data || []) as { id: string; name: string }[]).map((x) => ({ ...x, type: "machinery" as const })),
      ...((veh.data || []) as { id: string; name: string }[]).map((x) => ({ ...x, type: "vehicle" as const })),
    ];
    setEquipment(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const range = useMemo(() => {
    if (view === "month") {
      const s = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
      const e = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
      const days: Date[] = [];
      for (let d = s; d <= e; d = addDays(d, 1)) days.push(d);
      return days;
    } else {
      const s = startOfWeek(cursor, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(s, i));
    }
  }, [view, cursor]);

  const equipName = (type: string, id: string) =>
    equipment.find((e) => e.type === type && e.id === id)?.name || "Equipo";

  const itemsOnDay = (day: Date) => {
    const iso = format(day, "yyyy-MM-dd");
    const bs = bookings.filter((b) => isWithinInterval(day, { start: parseISO(b.start_date), end: parseISO(b.end_date) }));
    const ms = maintenance.filter((m) => isWithinInterval(day, { start: parseISO(m.start_date), end: parseISO(m.end_date) }));
    // detect conflicts: booking equipment overlaps maintenance same day
    const conflicts = bs.filter((b) =>
      ms.some((m) => m.equipment_type === b.equipment_type && m.equipment_id === b.equipment_id)
    );
    return { bs, ms, conflicts, iso };
  };

  const globalConflicts = useMemo(() => {
    const out: Array<{ booking: Booking; maint: Maintenance }> = [];
    for (const b of bookings) {
      for (const m of maintenance) {
        if (b.equipment_type === m.equipment_type && b.equipment_id === m.equipment_id &&
            overlap(b.start_date, b.end_date, m.start_date, m.end_date)) {
          out.push({ booking: b, maint: m });
        }
      }
    }
    return out;
  }, [bookings, maintenance]);

  const saveMaintenance = async () => {
    if (!mForm.equipment_id || !mForm.title) {
      toast.error("Completa equipo y título");
      return;
    }
    if (mForm.end_date < mForm.start_date) {
      toast.error("La fecha fin debe ser posterior");
      return;
    }
    const { error } = await supabase.from("equipment_maintenance").insert({
      equipment_type: mForm.equipment_type,
      equipment_id: mForm.equipment_id,
      start_date: mForm.start_date,
      end_date: mForm.end_date,
      title: mForm.title,
      notes: mForm.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Mantenimiento programado");
    setMOpen(false);
    setMForm({ ...mForm, title: "", notes: "" });
    load();
  };

  const removeMaintenance = async (id: string) => {
    const { error } = await supabase.from("equipment_maintenance").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Mantenimiento eliminado");
    load();
  };


  const openBookingFor = (day?: Date) => {
    const d = day ? format(day, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
    setBForm({ ...bForm, start_date: d, end_date: d, equipment_id: "", customer_name: "", customer_email: "", notes: "" });
    setBOpen(true);
  };

  const saveBooking = async () => {
    if (!bForm.equipment_id || !bForm.customer_name) {
      toast.error("Completa equipo y cliente");
      return;
    }
    if (bForm.end_date < bForm.start_date) {
      toast.error("Fecha fin inválida");
      return;
    }
    // conflict check
    const conflict = [...bookings, ...maintenance].some(
      (x: any) =>
        x.equipment_type === bForm.equipment_type &&
        x.equipment_id === bForm.equipment_id &&
        overlap(bForm.start_date, bForm.end_date, x.start_date, x.end_date),
    );
    if (conflict && !confirm("Este equipo ya tiene una reserva o mantenimiento en esas fechas. ¿Continuar?")) return;

    const payload = {
      equipment_type: bForm.equipment_type,
      equipment_id: bForm.equipment_id,
      start_date: bForm.start_date,
      end_date: bForm.end_date,
      customer_name: bForm.customer_name,
      customer_email: bForm.customer_email || null,
      notes: bForm.notes || null,
      status: bForm.status,
    };

    if (!navigator.onLine) {
      enqueue({ table: "equipment_bookings", action: "insert", payload, label: `Reserva ${bForm.customer_name}` });
      toast.success("Reserva guardada localmente (se sincronizará al reconectar)");
      setBOpen(false);
      return;
    }

    const { error } = await supabase.from("equipment_bookings").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Reserva creada");
    setBOpen(false);
    load();
  };

  const exportPdf = () => {
    const items: CalendarPdfItem[] = [];
    for (const b of bookings) {
      items.push({
        date: `${b.start_date} → ${b.end_date}`,
        kind: "Reserva",
        title: equipName(b.equipment_type, b.equipment_id),
        detail: b.customer_name || "Cliente",
        status: b.status,
      });
    }
    for (const m of maintenance) {
      items.push({
        date: `${m.start_date} → ${m.end_date}`,
        kind: "Mantenimiento",
        title: `${m.title} · ${equipName(m.equipment_type, m.equipment_id)}`,
        detail: m.notes || "—",
        status: m.status,
      });
    }
    items.sort((a, b) => a.date.localeCompare(b.date));
    const rangeLabel = view === "month"
      ? format(cursor, "MMMM yyyy", { locale: es })
      : `${format(startOfWeek(cursor, { weekStartsOn: 1 }), "d MMM", { locale: es })} — ${format(endOfWeek(cursor, { weekStartsOn: 1 }), "d MMM yyyy", { locale: es })}`;
    exportCalendarPdf(rangeLabel, items, globalConflicts.length);
  };

  const goPrev = () => setCursor(view === "month" ? subMonths(cursor, 1) : subWeeks(cursor, 1));
  const goNext = () => setCursor(view === "month" ? addMonths(cursor, 1) : addWeeks(cursor, 1));

  const equipmentByType = equipment.filter((e) => e.type === mForm.equipment_type);
  const bookingEquipmentByType = equipment.filter((e) => e.type === bForm.equipment_type);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Calendario operativo
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Reservas confirmadas y mantenimientos. Detecta conflictos de disponibilidad.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-md border border-border overflow-hidden">
              <Button variant={view === "month" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("month")}>Mes</Button>
              <Button variant={view === "week" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("week")}>Semana</Button>
            </div>
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
            <div className="text-sm font-medium min-w-[10rem] text-center capitalize">
              {view === "month"
                ? format(cursor, "MMMM yyyy", { locale: es })
                : `${format(startOfWeek(cursor, { weekStartsOn: 1 }), "d MMM", { locale: es })} — ${format(endOfWeek(cursor, { weekStartsOn: 1 }), "d MMM yyyy", { locale: es })}`}
            </div>
            <Button size="sm" variant="outline" onClick={exportPdf}>
              <FileDown className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMOpen(true)}>
              <Wrench className="h-4 w-4 mr-1" /> Mantto.
            </Button>
            <Button size="sm" onClick={() => openBookingFor()}>
              <CalendarPlus className="h-4 w-4 mr-1" /> Reserva
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {globalConflicts.length > 0 && (
            <div className="mb-4 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-destructive-foreground flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              <div className="text-sm">
                <p className="font-semibold text-destructive">{globalConflicts.length} conflicto(s) detectado(s)</p>
                <p className="text-xs opacity-80">Hay reservas que coinciden con ventanas de mantenimiento. Revísalas en el calendario.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden text-xs">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="bg-muted/70 py-2 text-center font-semibold text-muted-foreground">{d}</div>
            ))}
            {range.map((day) => {
              const { bs, ms, conflicts } = itemsOnDay(day);
              const inMonth = view === "week" || day.getMonth() === cursor.getMonth();
              const today = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setOpenDay(day)}
                  className={cn(
                    "bg-background min-h-[92px] p-1.5 text-left align-top transition-colors hover:bg-muted/50",
                    !inMonth && "opacity-40",
                    today && "ring-2 ring-primary ring-inset"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-xs font-medium", today && "text-primary")}>{format(day, "d")}</span>
                    {conflicts.length > 0 && (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {bs.slice(0, 2).map((b) => (
                      <div key={b.id} className={cn(
                        "truncate px-1 py-0.5 rounded text-[10px]",
                        conflicts.some((c) => c.id === b.id) ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
                      )}>
                        📅 {equipName(b.equipment_type, b.equipment_id)}
                      </div>
                    ))}
                    {ms.slice(0, 2).map((m) => (
                      <div key={m.id} className="truncate px-1 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        🔧 {equipName(m.equipment_type, m.equipment_id)}
                      </div>
                    ))}
                    {(bs.length + ms.length) > 4 && (
                      <div className="text-[10px] text-muted-foreground">+{bs.length + ms.length - 4} más</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary/60" /> Reserva</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-500/70" /> Mantenimiento</span>
            <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> Conflicto</span>
          </div>
        </CardContent>
      </Card>

      {/* Day drawer */}
      <Dialog open={!!openDay} onOpenChange={(o) => !o && setOpenDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {openDay && format(openDay, "EEEE d 'de' MMMM yyyy", { locale: es })}
            </DialogTitle>
          </DialogHeader>
          {openDay && (
            <div className="flex gap-2 mb-2">
              <Button size="sm" onClick={() => { const d = openDay; setOpenDay(null); openBookingFor(d); }}>
                <CalendarPlus className="h-4 w-4 mr-1" /> Nueva reserva este día
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const iso = format(openDay, "yyyy-MM-dd");
                setMForm({ ...mForm, start_date: iso, end_date: iso });
                setOpenDay(null);
                setMOpen(true);
              }}>
                <Wrench className="h-4 w-4 mr-1" /> Mantenimiento
              </Button>
            </div>
          )}
          {openDay && (() => {
            const { bs, ms, conflicts } = itemsOnDay(openDay);
            return (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {bs.length === 0 && ms.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin eventos programados.</p>
                )}
                {bs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Reservas</p>
                    <div className="space-y-2">
                      {bs.map((b) => (
                        <div key={b.id} className={cn(
                          "border border-border rounded-md p-2 text-sm",
                          conflicts.some((c) => c.id === b.id) && "border-destructive/60 bg-destructive/5"
                        )}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{equipName(b.equipment_type, b.equipment_id)}</span>
                            <Badge variant="outline">{b.status}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {b.customer_name || "Cliente"} · {b.start_date} → {b.end_date}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {ms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Mantenimientos</p>
                    <div className="space-y-2">
                      {ms.map((m) => (
                        <div key={m.id} className="border border-border rounded-md p-2 text-sm bg-amber-500/5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 font-medium">
                              <Wrench className="h-3 w-3" /> {m.title}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeMaintenance(m.id)}>Eliminar</Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {equipName(m.equipment_type, m.equipment_id)} · {m.start_date} → {m.end_date}
                          </div>
                          {m.notes && <p className="text-xs mt-1">{m.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* New maintenance dialog */}
      <Dialog open={mOpen} onOpenChange={setMOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar mantenimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={mForm.equipment_type} onValueChange={(v: "machinery" | "vehicle") => setMForm({ ...mForm, equipment_type: v, equipment_id: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="machinery">Maquinaria</SelectItem>
                    <SelectItem value="vehicle">Vehículo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipo</Label>
                <Select value={mForm.equipment_id} onValueChange={(v) => setMForm({ ...mForm, equipment_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {equipmentByType.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Desde</Label>
                <Input type="date" value={mForm.start_date} onChange={(e) => setMForm({ ...mForm, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input type="date" value={mForm.end_date} onChange={(e) => setMForm({ ...mForm, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Título</Label>
              <Input value={mForm.title} onChange={(e) => setMForm({ ...mForm, title: e.target.value })} placeholder="Ej. Cambio de aceite" />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={mForm.notes} onChange={(e) => setMForm({ ...mForm, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMOpen(false)}>Cancelar</Button>
            <Button onClick={saveMaintenance}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New booking dialog */}
      <Dialog open={bOpen} onOpenChange={setBOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva reserva</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={bForm.equipment_type} onValueChange={(v: "machinery" | "vehicle") => setBForm({ ...bForm, equipment_type: v, equipment_id: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="machinery">Maquinaria</SelectItem>
                    <SelectItem value="vehicle">Vehículo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipo</Label>
                <Select value={bForm.equipment_id} onValueChange={(v) => setBForm({ ...bForm, equipment_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {bookingEquipmentByType.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Desde</Label>
                <Input type="date" value={bForm.start_date} onChange={(e) => setBForm({ ...bForm, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input type="date" value={bForm.end_date} onChange={(e) => setBForm({ ...bForm, end_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cliente</Label>
                <Input value={bForm.customer_name} onChange={(e) => setBForm({ ...bForm, customer_name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={bForm.customer_email} onChange={(e) => setBForm({ ...bForm, customer_email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={bForm.status} onValueChange={(v) => setBForm({ ...bForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reserved">Reservada</SelectItem>
                  <SelectItem value="blocked">Bloqueada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={bForm.notes} onChange={(e) => setBForm({ ...bForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBOpen(false)}>Cancelar</Button>
            <Button onClick={saveBooking}>Crear reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
