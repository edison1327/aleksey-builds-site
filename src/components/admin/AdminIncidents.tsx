import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, MapPin, CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Incident = {
  id: string;
  work_order_id: string;
  severity: string;
  category: string | null;
  title: string;
  description: string | null;
  status: string;
  photo_url: string | null;
  lat: number | null;
  lng: number | null;
  reported_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type WO = { id: string; code: string; title: string; customer_name: string | null };

const STATUS_FLOW = ["open", "in_review", "resolved", "dismissed"];
const STATUS_LABEL: Record<string, string> = {
  open: "Abierta", in_review: "En revisión", resolved: "Resuelta", dismissed: "Descartada",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-red-500/15 text-red-700 border-red-500/30",
  in_review: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  dismissed: "bg-muted text-muted-foreground",
};
const SEV_COLOR: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  high: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  critical: "bg-red-500/15 text-red-700 border-red-500/30",
};

export default function AdminIncidents() {
  const [items, setItems] = useState<Incident[]>([]);
  const [wos, setWos] = useState<Record<string, WO>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("work_order_incidents" as any)
      .select("*")
      .order("created_at", { ascending: false });
    const rows = (data as any as Incident[]) || [];
    setItems(rows);
    const ids = Array.from(new Set(rows.map(r => r.work_order_id)));
    if (ids.length) {
      const { data: w } = await supabase
        .from("work_orders")
        .select("id,code,title,customer_name")
        .in("id", ids);
      const map: Record<string, WO> = {};
      (w || []).forEach((x: any) => { map[x.id] = x; });
      setWos(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-incidents-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "work_order_incidents" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (sevFilter !== "all" && i.severity !== sevFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const wo = wos[i.work_order_id];
        return (
          i.title.toLowerCase().includes(q) ||
          (i.description || "").toLowerCase().includes(q) ||
          (i.category || "").toLowerCase().includes(q) ||
          (wo?.code || "").toLowerCase().includes(q) ||
          (wo?.customer_name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, statusFilter, sevFilter, search, wos]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, in_review: 0, resolved: 0, dismissed: 0, critical: 0 };
    items.forEach(i => {
      c[i.status] = (c[i.status] || 0) + 1;
      if (i.severity === "critical" && i.status !== "resolved" && i.status !== "dismissed") c.critical++;
    });
    return c;
  }, [items]);

  const updateStatus = async (inc: Incident, next: string) => {
    const patch: any = { status: next };
    const note = notes[inc.id]?.trim();
    if (note) {
      const stamp = `[${new Date().toLocaleString("es")}] ${STATUS_LABEL[next]}: ${note}`;
      patch.description = inc.description ? `${inc.description}\n\n${stamp}` : stamp;
    }
    if (next === "resolved" || next === "dismissed") patch.resolved_at = new Date().toISOString();
    else patch.resolved_at = null;
    const { error } = await supabase.from("work_order_incidents" as any).update(patch).eq("id", inc.id);
    if (error) { toast.error(error.message); return; }
    setNotes({ ...notes, [inc.id]: "" });
    toast.success(`Marcada como ${STATUS_LABEL[next]}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          Incidencias de campo
        </h2>
        <p className="text-sm text-muted-foreground">Problemas reportados por operarios durante la ejecución de órdenes de trabajo.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: "critical", label: "Críticas activas", color: "text-red-600" },
          { key: "open", label: "Abiertas", color: "text-red-500" },
          { key: "in_review", label: "En revisión", color: "text-amber-500" },
          { key: "resolved", label: "Resueltas", color: "text-emerald-600" },
          { key: "dismissed", label: "Descartadas", color: "text-muted-foreground" },
        ].map(k => (
          <Card key={k.key} className="p-3">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className={cn("text-2xl font-bold", k.color)}>{counts[k.key] || 0}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por título, OT, cliente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUS_FLOW.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sevFilter} onValueChange={setSevFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda severidad</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Sin incidencias con estos filtros.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(inc => {
            const wo = wos[inc.work_order_id];
            return (
              <Card key={inc.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={SEV_COLOR[inc.severity]}>{inc.severity}</Badge>
                      <Badge variant="outline" className={STATUS_COLOR[inc.status]}>{STATUS_LABEL[inc.status]}</Badge>
                      {inc.category && <Badge variant="secondary">{inc.category}</Badge>}
                      {wo && (
                        <a href={`#workorders`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> {wo.code} · {wo.customer_name || "s/n"}
                        </a>
                      )}
                    </div>
                    <p className="mt-1 font-semibold">{inc.title}</p>
                    {inc.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{inc.description}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{format(new Date(inc.created_at), "dd MMM yyyy HH:mm", { locale: es })}</span>
                      {inc.lat && inc.lng && (
                        <a href={`https://maps.google.com/?q=${inc.lat},${inc.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline">
                          <MapPin className="h-3 w-3" /> Ver ubicación
                        </a>
                      )}
                      {inc.resolved_at && <span>Cerrada: {format(new Date(inc.resolved_at), "dd MMM HH:mm", { locale: es })}</span>}
                    </div>
                  </div>
                  {inc.photo_url && (
                    <a href={inc.photo_url} target="_blank" rel="noreferrer" className="shrink-0">
                      <img src={inc.photo_url} alt="" className="h-24 w-24 object-cover rounded-md border border-border" loading="lazy" />
                    </a>
                  )}
                </div>

                {inc.status !== "resolved" && inc.status !== "dismissed" && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <Textarea
                      rows={2}
                      placeholder="Nota de resolución o seguimiento (opcional)"
                      value={notes[inc.id] || ""}
                      onChange={(e) => setNotes({ ...notes, [inc.id]: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                      {inc.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(inc, "in_review")}>
                          Tomar y revisar
                        </Button>
                      )}
                      <Button size="sm" onClick={() => updateStatus(inc, "resolved")}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Resolver
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(inc, "dismissed")}>
                        <XCircle className="h-4 w-4 mr-1" /> Descartar
                      </Button>
                    </div>
                  </div>
                )}
                {(inc.status === "resolved" || inc.status === "dismissed") && (
                  <div className="mt-2">
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(inc, "open")}>Reabrir</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
