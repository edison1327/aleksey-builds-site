import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, History, Search, Download, User, Activity } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportCsv } from "@/lib/exportCsv";

interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
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
};

const PAGE_SIZE = 50;

const AdminAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

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
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`user_email.ilike.${term},entity_type.ilike.${term},entity_id.ilike.${term},action.ilike.${term}`);
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
  }, [page, actionFilter, entityFilter, search]);

  // Reset to page 0 on filter change
  useEffect(() => { setPage(0); }, [actionFilter, entityFilter, search]);

  const uniqueEntities = Array.from(new Set(entries.map((e) => e.entity_type)));
  const uniqueActions = Array.from(new Set(entries.map((e) => e.action)));

  const filtered = entries;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
            Historial de Auditoría
          </h2>
          <p className="text-muted-foreground">Registro de cambios en el panel administrativo</p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            exportCsv(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, filtered, [
              { key: "created_at", label: "Fecha", format: (v) => format(new Date(v as string), "yyyy-MM-dd HH:mm:ss") },
              { key: "user_email", label: "Usuario" },
              { key: "action", label: "Acción" },
              { key: "entity_type", label: "Entidad" },
              { key: "entity_id", label: "ID" },
              { key: "details", label: "Detalles", format: (v) => (v ? JSON.stringify(v) : "") },
            ])
          }
        >
          <Download className="h-4 w-4 mr-1" />
          CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{entries.length}</p>
              <p className="text-xs text-muted-foreground">Eventos registrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{new Set(entries.map((e) => e.user_email)).size}</p>
              <p className="text-xs text-muted-foreground">Usuarios activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <History className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{uniqueEntities.length}</p>
              <p className="text-xs text-muted-foreground">Tipos de entidad</p>
            </div>
          </CardContent>
        </Card>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos eventos ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay eventos que coincidan con los filtros.
            </p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map((e) => (
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
                    {e.details ? (
                      <details className="mt-1">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Ver detalles</summary>
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
    </div>
  );
};

export default AdminAuditLog;
