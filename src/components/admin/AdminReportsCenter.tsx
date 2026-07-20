import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Play, Save, Download, FileText, Plus, Share2 } from "lucide-react";

type Source = {
  table: string;
  label: string;
  columns: { key: string; label: string; type: "text" | "number" | "date" | "boolean" }[];
};

const SOURCES: Source[] = [
  {
    table: "invoices",
    label: "Facturas",
    columns: [
      { key: "invoice_number", label: "Nº factura", type: "text" },
      { key: "client_name", label: "Cliente", type: "text" },
      { key: "status", label: "Estado", type: "text" },
      { key: "total", label: "Total", type: "number" },
      { key: "paid_amount", label: "Pagado", type: "number" },
      { key: "issue_date", label: "Fecha emisión", type: "date" },
      { key: "due_date", label: "Vencimiento", type: "date" },
    ],
  },
  {
    table: "work_orders",
    label: "Órdenes de trabajo",
    columns: [
      { key: "wo_number", label: "Nº OT", type: "text" },
      { key: "title", label: "Título", type: "text" },
      { key: "status", label: "Estado", type: "text" },
      { key: "priority", label: "Prioridad", type: "text" },
      { key: "estimated_hours", label: "Horas estim.", type: "number" },
      { key: "actual_hours", label: "Horas reales", type: "number" },
      { key: "scheduled_date", label: "Fecha programada", type: "date" },
    ],
  },
  {
    table: "purchase_orders",
    label: "Órdenes de compra",
    columns: [
      { key: "po_number", label: "Nº OC", type: "text" },
      { key: "status", label: "Estado", type: "text" },
      { key: "total", label: "Total", type: "number" },
      { key: "issue_date", label: "Fecha", type: "date" },
    ],
  },
  {
    table: "contact_messages",
    label: "Mensajes / Cotizaciones",
    columns: [
      { key: "name", label: "Nombre", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "type", label: "Tipo", type: "text" },
      { key: "status", label: "Estado", type: "text" },
      { key: "created_at", label: "Fecha", type: "date" },
    ],
  },
  {
    table: "machinery",
    label: "Maquinaria",
    columns: [
      { key: "name", label: "Nombre", type: "text" },
      { key: "category", label: "Categoría", type: "text" },
      { key: "available", label: "Disponible", type: "boolean" },
      { key: "daily_rate", label: "Tarifa día", type: "number" },
    ],
  },
];

type Filter = { column: string; op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "ilike"; value: string };
type ReportConfig = {
  columns: string[];
  filters: Filter[];
  orderBy?: string;
  orderDir?: "asc" | "desc";
  limit?: number;
};

type SavedReport = {
  id: string;
  name: string;
  description: string | null;
  source: string;
  config: ReportConfig;
  is_shared: boolean;
  user_id: string;
};

export default function AdminReportsCenter() {
  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [sourceKey, setSourceKey] = useState<string>(SOURCES[0].table);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({ columns: [], filters: [], limit: 100 });
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const source = useMemo(() => SOURCES.find((s) => s.table === sourceKey)!, [sourceKey]);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    const { data, error } = await supabase
      .from("saved_reports")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) return toast.error(error.message);
    setSaved((data || []) as any);
  };

  const runReport = async () => {
    setLoading(true);
    try {
      const cols = config.columns.length ? config.columns.join(",") : "*";
      let q = (supabase as any).from(source.table).select(cols);
      for (const f of config.filters) {
        if (!f.column || f.value === "") continue;
        const v = f.op === "ilike" ? `%${f.value}%` : f.value;
        q = q[f.op](f.column, v);
      }
      if (config.orderBy) q = q.order(config.orderBy, { ascending: config.orderDir === "asc" });
      if (config.limit) q = q.limit(config.limit);
      const { data, error } = await q;
      if (error) throw error;
      setRows((data as any) || []);
      toast.success(`${data?.length || 0} filas`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!name.trim()) return toast.error("Nombre requerido");
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return toast.error("No autenticado");
    const payload = {
      name,
      description,
      source: sourceKey,
      config: config as any,
      is_shared: isShared,
      user_id: userRes.user.id,
    };
    const q = currentId
      ? supabase.from("saved_reports").update(payload).eq("id", currentId)
      : supabase.from("saved_reports").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Reporte guardado");
    loadSaved();
  };

  const loadReport = (r: SavedReport) => {
    setCurrentId(r.id);
    setName(r.name);
    setDescription(r.description || "");
    setIsShared(r.is_shared);
    setSourceKey(r.source);
    setConfig(r.config || { columns: [], filters: [] });
    setRows([]);
  };

  const newReport = () => {
    setCurrentId(null);
    setName("");
    setDescription("");
    setIsShared(false);
    setConfig({ columns: [], filters: [], limit: 100 });
    setRows([]);
  };

  const deleteReport = async (id: string) => {
    if (!confirm("¿Eliminar reporte?")) return;
    const { error } = await supabase.from("saved_reports").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (currentId === id) newReport();
    loadSaved();
  };

  const exportCSV = () => {
    if (!rows.length) return toast.error("Ejecuta el reporte primero");
    const cols = config.columns.length ? config.columns : Object.keys(rows[0]);
    const header = cols.join(",");
    const body = rows
      .map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "reporte"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!rows.length) return toast.error("Ejecuta el reporte primero");
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(name || "Reporte", 14, 15);
    const cols = config.columns.length ? config.columns : Object.keys(rows[0]);
    autoTable(doc, {
      head: [cols],
      body: rows.map((r) => cols.map((c) => String(r[c] ?? ""))),
      startY: 22,
      styles: { fontSize: 8 },
    });
    doc.save(`${name || "reporte"}.pdf`);
  };

  const toggleColumn = (key: string) => {
    setConfig((c) => ({
      ...c,
      columns: c.columns.includes(key) ? c.columns.filter((k) => k !== key) : [...c.columns, key],
    }));
  };

  const addFilter = () =>
    setConfig((c) => ({ ...c, filters: [...c.filters, { column: source.columns[0].key, op: "eq", value: "" }] }));

  const updateFilter = (i: number, patch: Partial<Filter>) =>
    setConfig((c) => ({ ...c, filters: c.filters.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) }));

  const removeFilter = (i: number) =>
    setConfig((c) => ({ ...c, filters: c.filters.filter((_, idx) => idx !== i) }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <CardTitle className="text-base">Guardados</CardTitle>
          <Button size="sm" variant="outline" onClick={newReport}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-auto">
          {saved.length === 0 && <p className="text-xs text-muted-foreground">Sin reportes guardados</p>}
          {saved.map((r) => (
            <div
              key={r.id}
              className={`p-2 rounded border cursor-pointer text-sm flex items-center justify-between gap-2 ${
                currentId === r.id ? "border-primary bg-muted" : "hover:bg-muted/50"
              }`}
              onClick={() => loadReport(r)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {SOURCES.find((s) => s.table === r.source)?.label || r.source}
                  {r.is_shared && <Share2 className="h-3 w-3" />}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteReport(r.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Constructor de reporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Facturas vencidas" />
              </div>
              <div>
                <Label>Fuente de datos</Label>
                <Select value={sourceKey} onValueChange={(v) => { setSourceKey(v); setConfig({ columns: [], filters: [], limit: 100 }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s.table} value={s.table}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="shared" checked={isShared} onCheckedChange={(v) => setIsShared(!!v)} />
              <Label htmlFor="shared" className="cursor-pointer">Compartir con todo el equipo</Label>
            </div>

            <div>
              <Label className="mb-2 block">Columnas</Label>
              <div className="flex flex-wrap gap-2">
                {source.columns.map((c) => (
                  <Badge
                    key={c.key}
                    variant={config.columns.includes(c.key) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleColumn(c.key)}
                  >
                    {c.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sin selección = todas</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Filtros</Label>
                <Button size="sm" variant="outline" onClick={addFilter}>
                  <Plus className="h-3 w-3 mr-1" /> Filtro
                </Button>
              </div>
              <div className="space-y-2">
                {config.filters.map((f, i) => (
                  <div key={i} className="grid grid-cols-[1fr_120px_1fr_auto] gap-2">
                    <Select value={f.column} onValueChange={(v) => updateFilter(i, { column: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {source.columns.map((c) => (
                          <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={f.op} onValueChange={(v: any) => updateFilter(i, { op: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">=</SelectItem>
                        <SelectItem value="neq">≠</SelectItem>
                        <SelectItem value="gt">&gt;</SelectItem>
                        <SelectItem value="gte">≥</SelectItem>
                        <SelectItem value="lt">&lt;</SelectItem>
                        <SelectItem value="lte">≤</SelectItem>
                        <SelectItem value="ilike">contiene</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={f.value} onChange={(e) => updateFilter(i, { value: e.target.value })} />
                    <Button variant="ghost" size="icon" onClick={() => removeFilter(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Ordenar por</Label>
                <Select value={config.orderBy || "__none"} onValueChange={(v) => setConfig((c) => ({ ...c, orderBy: v === "__none" ? undefined : v }))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {source.columns.map((c) => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dirección</Label>
                <Select value={config.orderDir || "desc"} onValueChange={(v: any) => setConfig((c) => ({ ...c, orderDir: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Límite</Label>
                <Input type="number" value={config.limit || 100} onChange={(e) => setConfig((c) => ({ ...c, limit: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={runReport} disabled={loading}>
                <Play className="h-4 w-4 mr-1" /> Ejecutar
              </Button>
              <Button onClick={saveReport} variant="outline">
                <Save className="h-4 w-4 mr-1" /> {currentId ? "Actualizar" : "Guardar"}
              </Button>
              <Button onClick={exportCSV} variant="outline" disabled={!rows.length}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button onClick={exportPDF} variant="outline" disabled={!rows.length}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {rows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultados ({rows.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {(config.columns.length ? config.columns : Object.keys(rows[0])).map((c) => (
                      <th key={c} className="text-left p-2 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      {(config.columns.length ? config.columns : Object.keys(rows[0])).map((c) => (
                        <td key={c} className="p-2">{String(r[c] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 200 && <p className="text-xs text-muted-foreground mt-2">Mostrando 200 de {rows.length}. Exporta para ver todo.</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
