import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RotateCcw, Trash2, Inbox } from "lucide-react";
import { format } from "date-fns";

type Kind = "contact_messages" | "blog_posts" | "projects";

interface Row {
  id: string;
  label: string;
  sub?: string;
  deleted_at: string;
}

const LABELS: Record<Kind, string> = {
  contact_messages: "Mensajes",
  blog_posts: "Blog",
  projects: "Proyectos",
};

const AdminTrash = () => {
  const { toast } = useToast();
  const [kind, setKind] = useState<Kind>("contact_messages");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<Kind, number>>({
    contact_messages: 0,
    blog_posts: 0,
    projects: 0,
  });

  const mapRow = (k: Kind, r: any): Row => {
    if (k === "contact_messages") {
      return { id: r.id, label: r.name || r.email || "Sin nombre", sub: r.email, deleted_at: r.deleted_at };
    }
    if (k === "blog_posts") {
      return { id: r.id, label: r.title || "Sin título", sub: r.slug, deleted_at: r.deleted_at };
    }
    return { id: r.id, label: r.title || "Sin título", sub: r.slug, deleted_at: r.deleted_at };
  };

  const load = async (k: Kind = kind) => {
    setLoading(true);
    const selectCols =
      k === "contact_messages" ? "id,name,email,deleted_at" : "id,title,slug,deleted_at";
    const { data, error } = await supabase
      .from(k)
      .select(selectCols)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setRows([]);
    } else {
      setRows((data || []).map((r) => mapRow(k, r)));
    }
    setLoading(false);
  };

  const loadCounts = async () => {
    const kinds: Kind[] = ["contact_messages", "blog_posts", "projects"];
    const entries = await Promise.all(
      kinds.map(async (k) => {
        const { count } = await supabase
          .from(k)
          .select("id", { count: "exact", head: true })
          .not("deleted_at", "is", null);
        return [k, count || 0] as const;
      })
    );
    setCounts(Object.fromEntries(entries) as Record<Kind, number>);
  };

  useEffect(() => { load(kind); }, [kind]);
  useEffect(() => { loadCounts(); }, [rows.length]);

  const restore = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.from(kind).update({ deleted_at: null }).eq("id", id);
    setBusyId(null);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Restaurado" });
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const purge = async (id: string) => {
    if (!confirm("¿Eliminar definitivamente? Esta acción no se puede deshacer.")) return;
    setBusyId(id);
    const { error } = await supabase.from(kind).delete().eq("id", id);
    setBusyId(null);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Eliminado definitivamente" });
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const purgeAll = async () => {
    if (!rows.length) return;
    if (!confirm(`¿Eliminar definitivamente los ${rows.length} elementos de la papelera?`)) return;
    const ids = rows.map((r) => r.id);
    const { error } = await supabase.from(kind).delete().in("id", ids);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Papelera vaciada" });
    load();
  };

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Papelera
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Restaura elementos eliminados o vacíalos definitivamente.
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={purgeAll} disabled={!rows.length}>
          Vaciar
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
          <TabsList>
            {(Object.keys(LABELS) as Kind[]).map((k) => (
              <TabsTrigger key={k} value={k} className="gap-2">
                {LABELS[k]}
                <Badge variant="secondary">{counts[k]}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={kind} className="mt-4">
            {loading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {empty && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Inbox className="h-10 w-10 mb-2" />
                <p>La papelera está vacía.</p>
              </div>
            )}
            {!loading && rows.length > 0 && (
              <ul className="divide-y divide-border rounded-md border border-border">
                {rows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.sub && <span>{r.sub} · </span>}
                        Eliminado {format(new Date(r.deleted_at), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restore(r.id)}
                        disabled={busyId === r.id}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => purge(r.id)}
                        disabled={busyId === r.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminTrash;
