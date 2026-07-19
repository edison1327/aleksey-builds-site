import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, MapPin, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WO {
  id: string;
  code: string;
  title: string;
  description: string | null;
  site_address: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface TE {
  work_order_id: string;
  hours: number | null;
  notes: string | null;
  entry_date: string | null;
}

interface Props {
  email: string;
}

const ClientServiceHistory = ({ email }: Props) => {
  const [wos, setWos] = useState<WO[]>([]);
  const [entries, setEntries] = useState<Record<string, TE[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: woData } = await (supabase as any)
        .from("work_orders")
        .select("id, code, title, description, site_address, started_at, completed_at")
        .ilike("customer_email", email)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      const list = (woData as WO[]) ?? [];
      setWos(list);

      if (list.length) {
        const ids = list.map((w) => w.id);
        const { data: teData } = await (supabase as any)
          .from("time_entries")
          .select("work_order_id, hours, notes, entry_date")
          .in("work_order_id", ids)
          .eq("approved", true);
        const grouped: Record<string, TE[]> = {};
        ((teData as TE[]) ?? []).forEach((t) => {
          if (!t.work_order_id) return;
          (grouped[t.work_order_id] ||= []).push(t);
        });
        setEntries(grouped);
      }
      setLoading(false);
    })();
  }, [email]);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (wos.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Aún no tienes servicios completados en tu historial.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
      {wos.map((wo) => {
        const te = entries[wo.id] ?? [];
        const totalHours = te.reduce((s, t) => s + Number(t.hours ?? 0), 0);
        return (
          <div key={wo.id} className="relative">
            <span className="absolute -left-[22px] top-2 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">{wo.code}</span>
                    <Badge className="bg-green-600">Completada</Badge>
                  </div>
                  {wo.completed_at && (
                    <span className="text-xs text-muted-foreground">
                      Finalizada {format(new Date(wo.completed_at), "PP", { locale: es })}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium">{wo.title}</div>
                {wo.description && <p className="text-sm text-muted-foreground">{wo.description}</p>}
                <div className="text-xs text-muted-foreground flex flex-wrap gap-3 pt-1">
                  {wo.site_address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{wo.site_address}</span>}
                  {totalHours > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{totalHours.toFixed(1)} h trabajadas</span>}
                </div>
                {te.some((t) => t.notes) && (
                  <div className="pt-2 border-t space-y-1">
                    <div className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-3 w-3" /> Notas del equipo
                    </div>
                    {te.filter((t) => t.notes).map((t, i) => (
                      <p key={i} className="text-xs text-muted-foreground italic">"{t.notes}"</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default ClientServiceHistory;
