import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarRange, MapPin, Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Booking {
  id: string;
  equipment_type: string | null;
  equipment_name: string | null;
  start_date: string;
  end_date: string;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-500",
    confirmed: "bg-green-600",
    completed: "bg-blue-600",
    cancelled: "bg-red-600",
  };
  const label: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
  };
  return <Badge className={map[s] || ""}>{label[s] || s}</Badge>;
};

interface Props {
  email: string;
}

const ClientBookings = ({ email }: Props) => {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("equipment_bookings")
        .select("id, equipment_type, equipment_name, start_date, end_date, status, location, notes, created_at")
        .eq("customer_email", email)
        .order("created_at", { ascending: false });
      setRows((data as Booking[]) ?? []);
      setLoading(false);
    };
    load();
  }, [email]);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (rows.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <CalendarRange className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No tienes reservas de equipos.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((b) => (
        <Card key={b.id}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-semibold">{b.equipment_name || b.equipment_type || "Equipo"}</span>
                {statusBadge(b.status)}
              </div>
              <span className="text-xs text-muted-foreground">
                Solicitada {format(new Date(b.created_at), "PP", { locale: es })}
              </span>
            </div>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
              <span className="flex items-center gap-1">
                <CalendarRange className="h-4 w-4" />
                {format(new Date(b.start_date), "PP", { locale: es })} — {format(new Date(b.end_date), "PP", { locale: es })}
              </span>
              {b.location && (
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {b.location}</span>
              )}
            </div>
            {b.notes && <p className="text-sm text-muted-foreground italic">"{b.notes}"</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientBookings;
