import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, FileDown, FileSignature, Link2, Plus, Send, Trash2, Pencil, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportContractPdf } from "@/lib/pdfExport";

type Template = { id: string; name: string; service_slug: string | null; body: string; is_active: boolean };
type Contract = {
  id: string; code: string; title: string; service_slug: string | null;
  customer_name: string; customer_email: string | null; customer_document: string | null; customer_address: string | null;
  amount: number | null; currency: string; body: string; status: string; sign_token: string;
  sent_at: string | null; signed_at: string | null; signature_data_url: string | null;
  template_id: string | null; notes: string | null; created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", sent: "Enviado", signed: "Firmado", cancelled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "secondary", sent: "default", signed: "outline", cancelled: "destructive",
} as any;

function interpolate(body: string, vars: Record<string, string | number | null>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] == null ? "" : String(vars[k])));
}

export default function AdminContracts() {
  const [tab, setTab] = useState<"contracts" | "templates">("contracts");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [editingTpl, setEditingTpl] = useState<Template | null>(null);
  const [openC, setOpenC] = useState(false);
  const [openT, setOpenT] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from("contracts" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("contract_templates" as any).select("*").order("name"),
    ]);
    setContracts((c as any) || []);
    setTemplates((t as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return contracts;
    return contracts.filter((c) =>
      [c.code, c.title, c.customer_name, c.customer_email].filter(Boolean).some((v) => v!.toLowerCase().includes(s))
    );
  }, [contracts, q]);

  const kpi = useMemo(() => ({
    total: contracts.length,
    sent: contracts.filter((c) => c.status === "sent").length,
    signed: contracts.filter((c) => c.status === "signed").length,
    amount: contracts.filter((c) => c.status === "signed").reduce((s, c) => s + (Number(c.amount) || 0), 0),
  }), [contracts]);

  const newContract = () => {
    setEditing({
      id: "", code: `CTR-${Date.now().toString().slice(-6)}`, title: "", service_slug: null,
      customer_name: "", customer_email: "", customer_document: "", customer_address: "",
      amount: null, currency: "PEN", body: "", status: "draft", sign_token: "",
      sent_at: null, signed_at: null, signature_data_url: null, template_id: null, notes: "", created_at: "",
    } as any);
    setOpenC(true);
  };

  const saveContract = async () => {
    if (!editing) return;
    const { id, sign_token, created_at, signed_at, signature_data_url, sent_at, ...rest } = editing as any;
    if (!rest.title || !rest.customer_name || !rest.body) {
      toast.error("Título, cliente y cuerpo son obligatorios");
      return;
    }
    if (id) {
      const { error } = await supabase.from("contracts" as any).update(rest).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("contracts" as any).insert(rest);
      if (error) return toast.error(error.message);
    }
    toast.success("Contrato guardado");
    setOpenC(false); setEditing(null); load();
  };

  const removeContract = async (id: string) => {
    if (!confirm("¿Eliminar contrato?")) return;
    const { error } = await supabase.from("contracts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado"); load();
  };

  const sendContract = async (c: Contract) => {
    const { error } = await supabase.from("contracts" as any).update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Marcado como enviado. Comparte el enlace de firma.");
    load();
  };

  const copyLink = async (c: Contract) => {
    const url = `${window.location.origin}/firmar/${c.sign_token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Enlace copiado");
  };

  const exportPdf = async (c: Contract) => {
    await exportContractPdf({
      code: c.code, title: c.title,
      customer_name: c.customer_name, customer_email: c.customer_email,
      customer_document: c.customer_document, customer_address: c.customer_address,
      amount: c.amount, currency: c.currency, body: c.body,
      status: c.status, signed_at: c.signed_at, signature_data_url: c.signature_data_url,
    });
  };

  const applyTemplate = (tplId: string) => {
    if (!editing) return;
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    const body = interpolate(tpl.body, {
      cliente: editing.customer_name, documento: editing.customer_document || "",
      direccion: editing.customer_address || "", email: editing.customer_email || "",
      titulo: editing.title, monto: editing.amount ?? "", moneda: editing.currency,
      fecha: format(new Date(), "dd/MM/yyyy", { locale: es }),
    });
    setEditing({ ...editing, template_id: tplId, body });
  };

  // Templates CRUD
  const newTpl = () => { setEditingTpl({ id: "", name: "", service_slug: "", body: "", is_active: true } as any); setOpenT(true); };
  const saveTpl = async () => {
    if (!editingTpl) return;
    if (!editingTpl.name || !editingTpl.body) return toast.error("Nombre y cuerpo requeridos");
    const { id, ...rest } = editingTpl as any;
    if (id) {
      const { error } = await supabase.from("contract_templates" as any).update(rest).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("contract_templates" as any).insert(rest);
      if (error) return toast.error(error.message);
    }
    toast.success("Plantilla guardada"); setOpenT(false); setEditingTpl(null); load();
  };
  const removeTpl = async (id: string) => {
    if (!confirm("¿Eliminar plantilla?")) return;
    const { error } = await supabase.from("contract_templates" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileSignature className="h-6 w-6" /> Contratos digitales</h2>
          <p className="text-sm text-muted-foreground">Emite y firma contratos con evidencia de fecha, IP y navegador.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "contracts" ? "default" : "outline"} onClick={() => setTab("contracts")}>Contratos</Button>
          <Button variant={tab === "templates" ? "default" : "outline"} onClick={() => setTab("templates")}>Plantillas</Button>
        </div>
      </div>

      {tab === "contracts" && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Card className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{kpi.total}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Enviados</p><p className="text-2xl font-bold">{kpi.sent}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Firmados</p><p className="text-2xl font-bold text-green-600">{kpi.signed}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Monto firmado</p><p className="text-2xl font-bold">S/ {kpi.amount.toFixed(2)}</p></Card>
          </div>

          <div className="flex gap-2 items-center">
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
            <Button onClick={newContract}><Plus className="h-4 w-4 mr-1" /> Nuevo contrato</Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3">Código</th><th className="p-3">Título</th><th className="p-3">Cliente</th>
                    <th className="p-3">Monto</th><th className="p-3">Estado</th><th className="p-3">Firmado</th><th className="p-3 w-1">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Cargando…</td></tr> :
                    filtered.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin contratos</td></tr> :
                      filtered.map((c) => (
                        <tr key={c.id} className="border-t">
                          <td className="p-3 font-mono text-xs">{c.code}</td>
                          <td className="p-3">{c.title}</td>
                          <td className="p-3">{c.customer_name}<div className="text-xs text-muted-foreground">{c.customer_email}</div></td>
                          <td className="p-3">{c.amount != null ? `${c.currency} ${Number(c.amount).toFixed(2)}` : "—"}</td>
                          <td className="p-3"><Badge variant={STATUS_COLOR[c.status] as any}>{STATUS_LABEL[c.status]}</Badge></td>
                          <td className="p-3 text-xs text-muted-foreground">{c.signed_at ? format(new Date(c.signed_at), "dd/MM/yy HH:mm", { locale: es }) : "—"}</td>
                          <td className="p-3 whitespace-nowrap">
                            <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditing(c); setOpenC(true); }}><Pencil className="h-4 w-4" /></Button>
                            {c.status === "draft" && (
                              <Button size="icon" variant="ghost" title="Enviar" onClick={() => sendContract(c)}><Send className="h-4 w-4" /></Button>
                            )}
                            {c.status !== "draft" && (
                              <Button size="icon" variant="ghost" title="Copiar enlace" onClick={() => copyLink(c)}><Link2 className="h-4 w-4" /></Button>
                            )}
                            <Button size="icon" variant="ghost" title="PDF" onClick={() => exportPdf(c)}><FileDown className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" title="Eliminar" onClick={() => removeContract(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "templates" && (
        <>
          <div className="flex justify-end"><Button onClick={newTpl}><Plus className="h-4 w-4 mr-1" /> Nueva plantilla</Button></div>
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((t) => (
              <Card key={t.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.service_slug || "General"} {t.is_active ? "" : "· inactiva"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingTpl(t); setOpenT(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeTpl(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{t.body}</p>
              </Card>
            ))}
            {templates.length === 0 && <p className="text-sm text-muted-foreground">Sin plantillas todavía.</p>}
          </div>
        </>
      )}

      {/* Contract dialog */}
      <Dialog open={openC} onOpenChange={(v) => { setOpenC(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar contrato" : "Nuevo contrato"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>Código *</Label><Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></div>
                <div><Label>Título *</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><Label>Cliente *</Label><Input value={editing.customer_name} onChange={(e) => setEditing({ ...editing, customer_name: e.target.value })} /></div>
                <div><Label>Email cliente</Label><Input value={editing.customer_email || ""} onChange={(e) => setEditing({ ...editing, customer_email: e.target.value })} /></div>
                <div><Label>Documento (DNI/RUC)</Label><Input value={editing.customer_document || ""} onChange={(e) => setEditing({ ...editing, customer_document: e.target.value })} /></div>
                <div><Label>Dirección</Label><Input value={editing.customer_address || ""} onChange={(e) => setEditing({ ...editing, customer_address: e.target.value })} /></div>
                <div><Label>Monto</Label><Input type="number" step="0.01" value={editing.amount ?? ""} onChange={(e) => setEditing({ ...editing, amount: e.target.value ? Number(e.target.value) : null })} /></div>
                <div>
                  <Label>Moneda</Label>
                  <Select value={editing.currency} onValueChange={(v) => setEditing({ ...editing, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="PEN">PEN</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Aplicar plantilla</Label>
                <Select value={editing.template_id || ""} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue placeholder="Elegir plantilla…" /></SelectTrigger>
                  <SelectContent>
                    {templates.filter((t) => t.is_active).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Reemplaza <code>{"{{cliente}} {{documento}} {{direccion}} {{titulo}} {{monto}} {{moneda}} {{fecha}}"}</code>.</p>
              </div>
              <div>
                <Label>Cuerpo del contrato *</Label>
                <Textarea rows={12} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
              </div>
              <div><Label>Notas internas</Label><Textarea rows={2} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenC(false)}>Cancelar</Button>
            <Button onClick={saveContract}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template dialog */}
      <Dialog open={openT} onOpenChange={(v) => { setOpenT(v); if (!v) setEditingTpl(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTpl?.id ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle></DialogHeader>
          {editingTpl && (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>Nombre *</Label><Input value={editingTpl.name} onChange={(e) => setEditingTpl({ ...editingTpl, name: e.target.value })} /></div>
                <div><Label>Servicio (slug)</Label><Input value={editingTpl.service_slug || ""} onChange={(e) => setEditingTpl({ ...editingTpl, service_slug: e.target.value })} /></div>
              </div>
              <div>
                <Label>Cuerpo *</Label>
                <Textarea rows={14} value={editingTpl.body} onChange={(e) => setEditingTpl({ ...editingTpl, body: e.target.value })}
                  placeholder="Usa {{cliente}}, {{titulo}}, {{monto}}, {{moneda}}, {{fecha}}…" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editingTpl.is_active} onChange={(e) => setEditingTpl({ ...editingTpl, is_active: e.target.checked })} />
                Activa
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenT(false)}>Cancelar</Button>
            <Button onClick={saveTpl}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
