import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Plus, Trash2, FileDown, DollarSign, Send, Bell } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportInvoicePdf } from "@/lib/pdfExport";

type Item = { id?: string; description: string; quantity: number; unit_price: number; total: number };
type Payment = { id: string; amount: number; method: string; reference: string | null; paid_at: string; notes: string | null };
type Invoice = {
  id: string;
  code: string;
  booking_id: string | null;
  work_order_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_tax_id: string | null;
  customer_address: string | null;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  status: string;
  notes: string | null;
  terms: string | null;
};

const STATUSES = [
  { v: "draft", label: "Borrador", color: "bg-muted text-muted-foreground" },
  { v: "sent", label: "Enviada", color: "bg-blue-500/15 text-blue-600" },
  { v: "partial", label: "Parcial", color: "bg-amber-500/15 text-amber-600" },
  { v: "paid", label: "Pagada", color: "bg-emerald-500/15 text-emerald-600" },
  { v: "overdue", label: "Vencida", color: "bg-destructive/15 text-destructive" },
  { v: "cancelled", label: "Cancelada", color: "bg-muted text-muted-foreground line-through" },
];
const METHODS = [
  { v: "transfer", label: "Transferencia" },
  { v: "cash", label: "Efectivo" },
  { v: "card", label: "Tarjeta" },
  { v: "check", label: "Cheque" },
  { v: "other", label: "Otro" },
];

const emptyItem = (): Item => ({ description: "", quantity: 1, unit_price: 0, total: 0 });

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [form, setForm] = useState<Partial<Invoice>>({
    customer_name: "", customer_email: "", customer_tax_id: "", customer_address: "",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    due_date: format(new Date(Date.now() + 30 * 864e5), "yyyy-MM-dd"),
    currency: "PEN", tax_rate: 18, status: "draft", notes: "", terms: "",
  });

  const [payOpen, setPayOpen] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payForm, setPayForm] = useState({ amount: 0, method: "transfer", reference: "", paid_at: format(new Date(), "yyyy-MM-dd"), notes: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Error al cargar facturas");
    setInvoices((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => invoices.filter(i =>
    (filter === "all" || i.status === filter) &&
    (!q || i.code.toLowerCase().includes(q.toLowerCase()) || i.customer_name.toLowerCase().includes(q.toLowerCase()))
  ), [invoices, filter, q]);

  const totals = useMemo(() => {
    const t = { count: filtered.length, total: 0, paid: 0, pending: 0 };
    filtered.forEach(i => { t.total += Number(i.total); t.paid += Number(i.amount_paid); t.pending += Number(i.total) - Number(i.amount_paid); });
    return t;
  }, [filtered]);

  const recalc = (arr: Item[], taxRate: number) => {
    const withTotals = arr.map(it => ({ ...it, total: Number((it.quantity * it.unit_price).toFixed(2)) }));
    const subtotal = withTotals.reduce((s, it) => s + it.total, 0);
    const tax = subtotal * (taxRate / 100);
    return { items: withTotals, subtotal: Number(subtotal.toFixed(2)), tax_amount: Number(tax.toFixed(2)), total: Number((subtotal + tax).toFixed(2)) };
  };

  const openNew = () => {
    setEditing(null);
    setItems([emptyItem()]);
    setForm({
      customer_name: "", customer_email: "", customer_tax_id: "", customer_address: "",
      issue_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(new Date(Date.now() + 30 * 864e5), "yyyy-MM-dd"),
      currency: "PEN", tax_rate: 18, status: "draft", notes: "", terms: "",
    });
    setDialogOpen(true);
  };

  const openEdit = async (inv: Invoice) => {
    setEditing(inv);
    setForm(inv);
    const { data } = await supabase.from("invoice_items").select("*").eq("invoice_id", inv.id).order("sort_order");
    setItems((data as any) || [emptyItem()]);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.customer_name) { toast.error("Ingresa el nombre del cliente"); return; }
    if (!items.length || !items[0].description) { toast.error("Agrega al menos una línea"); return; }
    const r = recalc(items, Number(form.tax_rate || 0));
    const code = editing?.code || `F-${format(new Date(), "yyyyMMdd")}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const payload: any = {
      code,
      customer_name: form.customer_name,
      customer_email: form.customer_email || null,
      customer_tax_id: form.customer_tax_id || null,
      customer_address: form.customer_address || null,
      issue_date: form.issue_date, due_date: form.due_date,
      currency: form.currency, tax_rate: form.tax_rate,
      subtotal: r.subtotal, tax_amount: r.tax_amount, total: r.total,
      status: form.status, notes: form.notes || null, terms: form.terms || null,
    };

    let invoiceId = editing?.id;
    if (editing) {
      const { error } = await supabase.from("invoices").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      await supabase.from("invoice_items").delete().eq("invoice_id", editing.id);
    } else {
      const { data, error } = await supabase.from("invoices").insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      invoiceId = data.id;
    }

    const itemsPayload = r.items.map((it, i) => ({
      invoice_id: invoiceId, description: it.description,
      quantity: it.quantity, unit_price: it.unit_price, total: it.total, sort_order: i,
    }));
    const { error: itErr } = await supabase.from("invoice_items").insert(itemsPayload);
    if (itErr) { toast.error(itErr.message); return; }

    toast.success(editing ? "Factura actualizada" : "Factura creada");
    setDialogOpen(false);
    load();
  };

  const markSent = async (inv: Invoice) => {
    const { error } = await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", inv.id);
    if (error) toast.error(error.message); else { toast.success("Marcada como enviada"); load(); }
  };

  const remove = async (inv: Invoice) => {
    if (!confirm(`Eliminar factura ${inv.code}?`)) return;
    const { error } = await supabase.from("invoices").delete().eq("id", inv.id);
    if (error) toast.error(error.message); else { toast.success("Eliminada"); load(); }
  };

  const openPayments = async (inv: Invoice) => {
    setPayOpen(inv);
    setPayForm({ amount: Number(inv.total) - Number(inv.amount_paid), method: "transfer", reference: "", paid_at: format(new Date(), "yyyy-MM-dd"), notes: "" });
    const { data } = await supabase.from("invoice_payments").select("*").eq("invoice_id", inv.id).order("paid_at", { ascending: false });
    setPayments((data as any) || []);
  };

  const addPayment = async () => {
    if (!payOpen || payForm.amount <= 0) { toast.error("Monto inválido"); return; }
    const { error } = await supabase.from("invoice_payments").insert({
      invoice_id: payOpen.id, amount: payForm.amount, method: payForm.method,
      reference: payForm.reference || null, paid_at: payForm.paid_at, notes: payForm.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Pago registrado");
    openPayments(payOpen);
    load();
  };

  const removePayment = async (id: string) => {
    if (!confirm("Eliminar este pago?")) return;
    await supabase.from("invoice_payments").delete().eq("id", id);
    if (payOpen) openPayments(payOpen);
    load();
  };

  const downloadPdf = async (inv: Invoice) => {
    const { data } = await supabase.from("invoice_items").select("*").eq("invoice_id", inv.id).order("sort_order");
    await exportInvoicePdf({
      ...inv,
      items: (data || []).map((it: any) => ({
        description: it.description, quantity: Number(it.quantity),
        unit_price: Number(it.unit_price), total: Number(it.total),
      })),
      subtotal: Number(inv.subtotal), tax_rate: Number(inv.tax_rate),
      tax_amount: Number(inv.tax_amount), total: Number(inv.total),
      amount_paid: Number(inv.amount_paid),
    });
  };

  const sendReminder = async (inv: Invoice) => {
    // Registro en notificaciones internas del admin (no requiere email)
    const { error } = await supabase.from("notifications").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      type: "invoice_reminder",
      title: `Recordatorio: ${inv.code}`,
      message: `${inv.customer_name} — saldo ${inv.currency} ${(Number(inv.total) - Number(inv.amount_paid)).toFixed(2)} vence ${inv.due_date}`,
      link: "/admin#invoices",
      metadata: { invoice_id: inv.id },
    });
    if (error) toast.error(error.message);
    else toast.success("Recordatorio registrado en la bandeja");
  };

  const badge = (s: string) => {
    const st = STATUSES.find(x => x.v === s);
    return <Badge className={st?.color}>{st?.label || s}</Badge>;
  };

  const preview = recalc(items, Number(form.tax_rate || 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Facturación</h2>
          <p className="text-sm text-muted-foreground">Emite facturas, controla pagos y envía recordatorios de cobro.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nueva factura</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Facturas</div><div className="text-2xl font-bold">{totals.count}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total emitido</div><div className="text-2xl font-bold">{totals.total.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Cobrado</div><div className="text-2xl font-bold text-emerald-600">{totals.paid.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Por cobrar</div><div className="text-2xl font-bold text-amber-600">{totals.pending.toFixed(2)}</div></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar por código o cliente..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUSES.map(s => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Código</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Emisión</th>
                <th className="p-3">Vence</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Saldo</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Cargando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Sin facturas</td></tr>
              : filtered.map(inv => {
                const saldo = Number(inv.total) - Number(inv.amount_paid);
                const overdue = new Date(inv.due_date) < new Date() && saldo > 0 && inv.status !== "paid";
                return (
                  <tr key={inv.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{inv.code}</td>
                    <td className="p-3">{inv.customer_name}</td>
                    <td className="p-3">{format(new Date(inv.issue_date), "dd/MM/yy")}</td>
                    <td className={`p-3 ${overdue ? "text-destructive font-medium" : ""}`}>{format(new Date(inv.due_date), "dd/MM/yy")}</td>
                    <td className="p-3 text-right font-medium">{inv.currency} {Number(inv.total).toFixed(2)}</td>
                    <td className="p-3 text-right">{saldo.toFixed(2)}</td>
                    <td className="p-3">{badge(inv.status)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => openPayments(inv)} title="Pagos"><DollarSign className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadPdf(inv)} title="PDF"><FileDown className="w-4 h-4" /></Button>
                      {inv.status === "draft" && <Button size="sm" variant="ghost" onClick={() => markSent(inv)} title="Marcar enviada"><Send className="w-4 h-4" /></Button>}
                      {saldo > 0 && inv.status !== "draft" && <Button size="sm" variant="ghost" onClick={() => sendReminder(inv)} title="Recordar cobro"><Bell className="w-4 h-4" /></Button>}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(inv)}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(inv)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Editor */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Editar ${editing.code}` : "Nueva factura"}</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Cliente *</Label><Input value={form.customer_name || ""} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div><Label>RUC / NIF</Label><Input value={form.customer_tax_id || ""} onChange={e => setForm({ ...form, customer_tax_id: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.customer_email || ""} onChange={e => setForm({ ...form, customer_email: e.target.value })} /></div>
            <div><Label>Dirección</Label><Input value={form.customer_address || ""} onChange={e => setForm({ ...form, customer_address: e.target.value })} /></div>
            <div><Label>Emisión</Label><Input type="date" value={form.issue_date || ""} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></div>
            <div><Label>Vencimiento</Label><Input type="date" value={form.due_date || ""} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><Label>Moneda</Label>
              <Select value={form.currency || "PEN"} onValueChange={v => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["PEN", "USD", "EUR", "MXN", "CLP", "COP", "ARS"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Impuesto (%)</Label><Input type="number" step="0.01" value={form.tax_rate ?? 0} onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) })} /></div>
            <div><Label>Estado</Label>
              <Select value={form.status || "draft"} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between">
              <Label>Ítems</Label>
              <Button size="sm" variant="outline" onClick={() => setItems([...items, emptyItem()])}><Plus className="w-4 h-4 mr-1" /> Añadir línea</Button>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <Input className="col-span-6" placeholder="Descripción" value={it.description}
                  onChange={e => { const c = [...items]; c[idx].description = e.target.value; setItems(c); }} />
                <Input className="col-span-2" type="number" step="0.01" placeholder="Cant." value={it.quantity}
                  onChange={e => { const c = [...items]; c[idx].quantity = Number(e.target.value); setItems(c); }} />
                <Input className="col-span-2" type="number" step="0.01" placeholder="Precio" value={it.unit_price}
                  onChange={e => { const c = [...items]; c[idx].unit_price = Number(e.target.value); setItems(c); }} />
                <div className="col-span-1 text-right pt-2 text-sm font-medium">{(it.quantity * it.unit_price).toFixed(2)}</div>
                <Button className="col-span-1" size="sm" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
          </div>

          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div><Label>Notas</Label><Textarea rows={3} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div><Label>Términos y condiciones</Label><Textarea rows={3} value={form.terms || ""} onChange={e => setForm({ ...form, terms: e.target.value })} /></div>
          </div>

          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{preview.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Impuesto ({form.tax_rate || 0}%)</span><span>{preview.tax_amount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span>{form.currency} {preview.total.toFixed(2)}</span></div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payments */}
      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Pagos — {payOpen?.code}</DialogTitle></DialogHeader>
          {payOpen && (
            <>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-md bg-muted/40 p-2"><div className="text-xs text-muted-foreground">Total</div><div className="font-bold">{payOpen.currency} {Number(payOpen.total).toFixed(2)}</div></div>
                <div className="rounded-md bg-emerald-500/10 p-2"><div className="text-xs text-muted-foreground">Pagado</div><div className="font-bold text-emerald-600">{Number(payOpen.amount_paid).toFixed(2)}</div></div>
                <div className="rounded-md bg-amber-500/10 p-2"><div className="text-xs text-muted-foreground">Saldo</div><div className="font-bold text-amber-600">{(Number(payOpen.total) - Number(payOpen.amount_paid)).toFixed(2)}</div></div>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <div className="text-sm font-medium">Registrar pago</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div><Label className="text-xs">Monto</Label><Input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs">Método</Label>
                    <Select value={payForm.method} onValueChange={v => setPayForm({ ...payForm, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{METHODS.map(m => <SelectItem key={m.v} value={m.v}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Referencia</Label><Input value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} /></div>
                  <div><Label className="text-xs">Fecha</Label><Input type="date" value={payForm.paid_at} onChange={e => setPayForm({ ...payForm, paid_at: e.target.value })} /></div>
                </div>
                <Textarea placeholder="Notas (opcional)" rows={2} value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
                <Button onClick={addPayment} size="sm"><Plus className="w-4 h-4 mr-1" /> Añadir pago</Button>
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto">
                {payments.length === 0 ? <div className="text-sm text-muted-foreground text-center py-4">Sin pagos registrados</div>
                : payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                    <div>
                      <div className="font-medium">{payOpen.currency} {Number(p.amount).toFixed(2)} <span className="text-muted-foreground font-normal">— {METHODS.find(m => m.v === p.method)?.label}</span></div>
                      <div className="text-xs text-muted-foreground">{format(new Date(p.paid_at), "dd MMM yyyy", { locale: es })}{p.reference ? ` · ${p.reference}` : ""}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removePayment(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
