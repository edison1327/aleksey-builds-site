import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  equipmentType: "machinery" | "vehicle";
  equipmentId: string;
}

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
}

const expandRange = (start: string, end: string): Date[] => {
  const out: Date[] = [];
  const s = new Date(start);
  const e = new Date(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(new Date(d));
  }
  return out;
};

const BookingCalendarView = ({ equipmentType, equipmentId }: Props) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!equipmentId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from("equipment_bookings")
        .select("id, start_date, end_date, status")
        .eq("equipment_type", equipmentType)
        .eq("equipment_id", equipmentId)
        .gte("end_date", today)
        .in("status", ["reserved", "blocked"])
        .order("start_date");
      if (active) {
        setBookings((data || []) as Booking[]);
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [equipmentType, equipmentId]);

  const unavailableDates = useMemo(
    () => bookings.flatMap((b) => expandRange(b.start_date, b.end_date)),
    [bookings]
  );

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="rounded-lg border p-3 bg-card">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Disponibilidad</h4>
        <Badge variant="secondary" className="text-[10px]">{bookings.length} reservas</Badge>
      </div>
      <Calendar
        mode="multiple"
        selected={unavailableDates}
        onSelect={() => {}}
        disabled={() => true}
        modifiers={{ booked: unavailableDates }}
        modifiersClassNames={{ booked: "bg-destructive/20 text-destructive line-through" }}
        className={cn("p-0 pointer-events-auto")}
      />
      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-destructive/20" /> Ocupado</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border" /> Disponible</span>
      </div>
    </div>
  );
};

export default BookingCalendarView;
