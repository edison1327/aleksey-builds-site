import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, MapPin, Calendar as CalIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WO {
  id: string;
  code: string;
  title: string;
  description: string | null;
  site_address: string | null;
  status: string;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-gray-500",
    scheduled: "bg-blue-600",
    in_progress: "bg-amber-500",
    completed: "bg-green-600",
    cancelled: "bg-red-600",
  };
  const label: Record<string, string> = {
    pending: "Pendiente",
    scheduled: "Programada",
    in_progress: "En ejecución",
    completed: "Completada",
    cancelled: "Cancelada",
  };
  return <Badge className={map[s] || ""}>{label[s] || s}</Badge>;
};

interface Props {
  email: string;
}

const ClientWorkOrders = ({ email }: Props) => {
  const [rows, setRows] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("work_orders")
        .select("id, code, title, description, site_address, status, priority, scheduled_start, scheduled_end, started_at, completed_at, created_at")
        .ilike("customer_email", email)
        .order("created_at", { ascending: false });
      setRows((data as WO[]) ?? []);
      setLoading(false);
    };
    load();
  }, [email]);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (rows.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No tienes órdenes de trabajo.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((wo) => (
        <Card key={wo.id}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <span className="font-semibold">{wo.code}</span>
                {statusBadge(wo.status)}
              </div>
              <span className="text-xs text-muted-foreground">
                Creada {format(new Date(wo.created_at), "PP", { locale: es })}
              </span>
            </div>
            <div className="text-sm font-medium">{wo.title}</div>
            {wo.description && <p className="text-sm text-muted-foreground line-clamp-2">{wo.description}</p>}
            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
              {wo.site_address && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{wo.site_address}</span>
              )}
              {wo.scheduled_start && (
                <span className="flex items-center gap-1">
                  <CalIcon className="h-3 w-3" />
                  {format(new Date(wo.scheduled_start), "PPp", { locale: es })}
                </span>
              )}
              {wo.completed_at && (
                <span className="text-green-700">Finalizada: {format(new Date(wo.completed_at), "PPp", { locale: es })}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientWorkOrders;
