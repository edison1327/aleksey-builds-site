import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, History, Search, Download, User, Activity, Radio, FileJson } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { exportCsv } from "@/lib/exportCsv";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { toast } from "@/hooks/use-toast";

interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  bulk_delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  bulk_update: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  reorder: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  status_change: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  export: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  login: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const PAGE_SIZE = 50;

/** Renders a compact before/after diff when details contain those keys. */
const DiffView = ({ details }: { details: any }) => {
  if (!details || typeof details !== "object") return null;
  const before = details.before ?? details.old ?? details.previous;
  const after = details.after ?? details.new ?? details.next;
  if (!before || !after || typeof before !== "object" || typeof after !== "object") return null;

  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const changed = keys.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  if (!changed.length) return null;

  return (
    <div className="mt-2 rounded border bg-muted/40 divide-y">
      {changed.map((k) => (
        <div key={k} className="grid grid-cols-[120px_1fr_1fr] gap-2 p-2 text-xs">
          <span className="font-mono text-muted-foreground truncate">{k}</span>
          <span className="text-red-700 dark:text-red-400 line-through break-all">
            {JSON.stringify(before[k]) ?? "∅"}
          </span>
          <span className="text-green-700 dark:text-green-400 break-all">
            {JSON.stringify(after[k]) ?? "∅"}
          </span>
        </div>
      ))}
    </div>
  );
};

const AdminAuditLog = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch entries
  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      let query = supabase
        .from("audit_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (entityFilter !== "all") query = query.eq("entity_type", entityFilter);
      if (onlyMine && user?.id) query = query.eq("user_id", user.id);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(
          `user_email.ilike.${term},entity_type.ilike.${term},entity_id.ilike.${term},action.ilike.${term}`
        );
      }

      const { data, error, count } = await query;
      if (!error && data) {
        setEntries(data as AuditEntry[]);
        setTotalCount(count || 0);
      }
      setIsLoading(false);
    };
    const t = setTimeout(fetchEntries, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [page, actionFilter, entityFilter, search, onlyMine, user?.id]);

  useEffect(() => { setPage(0); }, [actionFilter, entityFilter, search, onlyMine]);

  // Realtime subscription
  useEffect(() => {
    if (!liveMode) return;
    const channel = supabase
      .channel(`audit-log-live-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log" },
        (payload) => {
          const row = payload.new as AuditEntry;
          if (page !== 0) return;
          if (actionFilter !== "all" && row.action !== actionFilter) return;
          if (entityFilter !== "all" && row.entity_type !== entityFilter) return;
          if (onlyMine && row.user_id !== user?.id) return;
          setEntries((prev) => [row, ...prev].slice(0, PAGE_SIZE));
          setTotalCount((c) => c + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [liveMode, page, actionFilter, entityFilter, onlyMine, user?.id]);

  // Stats for last 14 days (independent query)
  const [stats, setStats] = useState<{ day: string; count: number }[]>([]);
  const [topUsers, setTopUsers] = useState<{ email: string; count: number }[]>([]);
  useEffect(() => {
    (async () => {
      const since = startOfDay(subDays(new Date(), 13)).toISOString();
      const { data } = await supabase
        .from("audit_log")
        .select("created_at, user_email")
        .gte("created_at", since)
        .limit(5000);
      if (!data) return;
      const byDay = new Map<string, number>();
      const byUser = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        byDay.set(format(subDays(new Date(), i), "MM-dd"), 0);
      }
      for (const r of data) {
        const k = format(new Date(r.created_at as string), "MM-dd");
        byDay.set(k, (byDay.get(k) || 0) + 1);
        const u = (r.user_email as string) || "Sistema";
        byUser.set(u, (byUser.get(u) || 0) + 1);
      }
      setStats(Array.from(byDay.entries()).map(([day, count]) => ({ day, count })));
      setTopUsers(
        Array.from(byUser.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([email, count]) => ({ email, count }))
      );
    })();
  }, [entries.length]);

  const uniqueEntities = useMemo(
    () => Array.from(new Set(entries.map((e) => e.entity_type))),
    [entries]
  );
  const uniqueActions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.action))),
    [entries]
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: `${entries.length} eventos en JSON.` });
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Auditoría avanzada
          </h2>
          <p className="text-muted-foreground">Registro completo con diff, tiempo real y análisis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 h-9 rounded-md border bg-card">
            <Radio className={`h-4 w-4 ${liveMode ? "text-green-600 animate-pulse" : "text-muted-foreground"}`} />
            <Switch id="live" checked={liveMode} onCheckedChange={setLiveMode} />
            <Label htmlFor="live" className="text-sm cursor-pointer">Live</Label>
          </div>
          <Button variant="outline" size="sm" onClick={exportJson}>
            <FileJson className="h-4 w-4 mr-1" /> JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportCsv(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, entries, [
                { key: "created_at", label: "Fecha", format: (v) => format(new Date(v as string), "yyyy-MM-dd HH:mm:ss") },
                { key: "user_email", label: "Usuario" },
                { key: "action", label: "Acción" },
                { key: "entity_type", label: "Entidad" },
                { key: "entity_id", label: "ID" },
                { key: "details", label: "Detalles", format: (v) => (v ? JSON.stringify(v) : "") },
              ])
            }
          >
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Eventos totales</p>
              </div>
            </CardContent></Card>
            <Card><CardContent className="pt-4 flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{new Set(entries.map((e) => e.user_email)).size}</p>
                <p className="text-xs text-muted-foreground">Usuarios en página</p>
              </div>
            </CardContent></Card>
            <Card><CardContent className="pt-4 flex items-center gap-3">
              <History className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{uniqueEntities.length}</p>
                <p className="text-xs text-muted-foreground">Tipos de entidad</p>
              </div>
            </CardContent></Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario, entidad, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Acción" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                {uniqueActions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Entidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las entidades</SelectItem>
                {uniqueEntities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-3 rounded-md border bg-card">
              <Switch id="only-mine" checked={onlyMine} onCheckedChange={setOnlyMine} />
              <Label htmlFor="only-mine" className="text-sm cursor-pointer whitespace-nowrap">Solo mis acciones</Label>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Eventos ({totalCount.toLocaleString()})</CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <Button size="sm" variant="outline" disabled={page === 0 || isLoading} onClick={() => setPage((p) => Math.max(0, p - 1))}>Anterior</Button>
                <span className="text-xs text-muted-foreground">Página {page + 1} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page + 1 >= totalPages || isLoading} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay eventos que coincidan con los filtros.</p>
              ) : (
                <div className="space-y-2">
                  {entries.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                      <Badge className={actionColors[e.action] || "bg-gray-100 text-gray-700"}>{e.action}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{e.entity_type}</span>
                          {e.entity_id && <span className="text-xs text-muted-foreground truncate">#{e.entity_id.slice(0, 8)}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {e.user_email || "Sistema"} · {format(new Date(e.created_at), "PPp", { locale: es })}
                        </p>
                        <DiffView details={e.details} />
                        {e.details ? (
                          <details className="mt-1">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Ver JSON completo</summary>
                            <pre className="mt-1 p-2 bg-muted rounded text-[10px] overflow-x-auto">{JSON.stringify(e.details, null, 2)}</pre>
                          </details>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Actividad — últimos 14 días</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" fontSize={11} />
                    <YAxis fontSize={11} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Top usuarios (14 días)</CardTitle></CardHeader>
            <CardContent>
              {topUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>
              ) : (
                <div className="space-y-2">
                  {topUsers.map((u) => {
                    const max = topUsers[0].count || 1;
                    return (
                      <div key={u.email} className="flex items-center gap-3">
                        <span className="text-sm w-56 truncate">{u.email}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${(u.count / max) * 100}%` }} />
                        </div>
                        <span className="text-xs tabular-nums w-10 text-right">{u.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAuditLog;
