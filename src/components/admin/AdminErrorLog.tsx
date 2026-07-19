import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Trash2, AlertTriangle, AlertCircle, Info, Skull, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type Severity = "info" | "warning" | "error" | "fatal";

interface ErrorRow {
  id: string;
  created_at: string;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  user_id: string | null;
  severity: Severity;
  context: any;
}

const PAGE_SIZE = 25;

const severityMeta: Record<Severity, { label: string; icon: any; className: string }> = {
  info: { label: "Info", icon: Info, className: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  warning: { label: "Advertencia", icon: AlertTriangle, className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  error: { label: "Error", icon: AlertCircle, className: "bg-red-500/15 text-red-500 border-red-500/30" },
  fatal: { label: "Fatal", icon: Skull, className: "bg-red-700/20 text-red-600 border-red-700/40" },
};

export default function AdminErrorLog() {
  const [rows, setRows] = useState<ErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("error_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (severity !== "all") q = q.eq("severity", severity);
    if (search.trim()) q = q.ilike("message", `%${search.trim()}%`);

    const { data, count, error } = await q;
    if (error) {
      toast({ title: "Error al cargar", description: error.message, variant: "destructive" });
    } else {
      setRows((data as ErrorRow[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, severity]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const clearOld = async () => {
    if (!confirm("¿Eliminar errores de más de 30 días?")) return;
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("error_log").delete().lt("created_at", cutoff);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Limpieza completada" });
      load();
    }
  };

  const deleteOne = async (id: string) => {
    const { error } = await supabase.from("error_log").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Registro de Errores</h2>
          <p className="text-sm text-muted-foreground">
            Errores capturados en tiempo de ejecución del sitio y del CMS.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
          <Button variant="outline" size="sm" onClick={clearOld}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar &gt;30 días
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Buscar por mensaje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda severidad</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="fatal">Fatal</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto text-sm text-muted-foreground self-center">
              {total} registro{total === 1 ? "" : "s"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">Cargando…</div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              Sin errores registrados. 🎉
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {rows.map((row) => {
                  const meta = severityMeta[row.severity] ?? severityMeta.error;
                  const Icon = meta.icon;
                  const isOpen = expanded === row.id;
                  return (
                    <div
                      key={row.id}
                      className="border rounded-lg bg-card overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : row.id)}
                        className="w-full text-left p-3 hover:bg-muted/40 transition-colors flex items-start gap-3"
                      >
                        <Badge variant="outline" className={`${meta.className} shrink-0 mt-0.5`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {meta.label}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm truncate">{row.message}</div>
                          <div className="text-xs text-muted-foreground flex gap-3 mt-1 flex-wrap">
                            <span>
                              {formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: es })}
                            </span>
                            {row.url && <span className="truncate max-w-xs">{row.url}</span>}
                          </div>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t bg-muted/20 p-4 space-y-3 text-xs">
                          {row.url && (
                            <div>
                              <div className="font-semibold text-muted-foreground mb-1">URL</div>
                              <a href={row.url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 break-all">
                                {row.url} <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                          {row.stack && (
                            <div>
                              <div className="font-semibold text-muted-foreground mb-1">Stack trace</div>
                              <pre className="bg-background border rounded p-2 overflow-x-auto whitespace-pre-wrap text-[11px]">
                                {row.stack}
                              </pre>
                            </div>
                          )}
                          {row.context && (
                            <div>
                              <div className="font-semibold text-muted-foreground mb-1">Contexto</div>
                              <pre className="bg-background border rounded p-2 overflow-x-auto text-[11px]">
                                {JSON.stringify(row.context, null, 2)}
                              </pre>
                            </div>
                          )}
                          {row.user_agent && (
                            <div>
                              <div className="font-semibold text-muted-foreground mb-1">User agent</div>
                              <div className="text-muted-foreground break-all">{row.user_agent}</div>
                            </div>
                          )}
                          <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => deleteOne(row.id)}>
                              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
