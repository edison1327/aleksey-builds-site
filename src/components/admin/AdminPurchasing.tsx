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
import { Plus, Pencil, Trash2, ShoppingCart, PackageCheck, FileEdit, ArrowRight, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";

type Supplier = { id: string; name: string };
type PO = {
  id: string; code: string; supplier_id: string | null; work_order_id: string | null;
  title: string; currency: string; subtotal: number; tax: number; total: number;
  status: string; expected_at: string | null; delivered_at: string | null;
  payment_terms: string | null; notes: string | null; created_at: string;
};
type POItem = {
  id: string; purchase_order_id: string; description: string;
  quantity: number; unit: string; unit_price: number; subtotal: number; received_qty: number;
};
type Reception = {
  id: string; purchase_order_id: string; received_at: string; delivery_note: string | null;
  received_by: string | null; notes: string | null;
};
type Req = {
  id: string; code: string; work_order_id: string | null; requester_name: string | null;
  status: string; notes: string | null; converted_po_id: string | null; created_at: string;
};
type ReqItem = { id: string; requisition_id: string; description: string; quantity: number; unit: string; notes: string | null };

const PO_STATUS: Record<string,string> = { draft:"Borrador", sent:"Enviada", confirmed:"Confirmada", partial:"Parcial", received:"Recibida", invoiced:"Facturada", cancelled:"Cancelada" };
const PO_COLORS: Record<string,string> = { draft:"secondary", sent:"default", confirmed:"default", partial:"outline", received:"default", invoiced:"default", cancelled:"destructive" };
const REQ_STATUS: Record<string,string> = { pending:"Pendiente", approved:"Aprobada", rejected:"Rechazada", converted:"Convertida" };

export default function AdminPurchasing() {
  const [tab, setTab] = useState<"pos"|"receptions"|"requisitions"|"dashboard">("pos");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pos, setPos] = useState<PO[]>([]);
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [reqItems, setReqItems] = useState<ReqItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editPo, setEditPo] = useState<PO | null>(null);
  const [openPo, setOpenPo] = useState(false);
  const [editItems, setEditItems] = useState<POItem[]>([]);

  const [recPo, setRecPo] = useState<PO | null>(null);
  const [openRec, setOpenRec] = useState(false);
  const [recDraft, setRecDraft] = useState<{ delivery_note: string; received_by: string; notes: string; items: Record<string, number> }>({ delivery_note: "", received_by: "", notes: "", items: {} });

  const [editReq, setEditReq] = useState<Req | null>(null);
  const [openReq, setOpenReq] = useState(false);
  const [editReqItems, setEditReqItems] = useState<ReqItem[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }, { data: pi }, { data: r }, { data: rq }, { data: ri }] = await Promise.all([
      supabase.from("suppliers" as any).select("id,name").order("name"),
      supabase.from("purchase_orders" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("purchase_order_items" as any).select("*"),
      supabase.from("purchase_receptions" as any).select("*").order("received_at", { ascending: false }),
      supabase.from("requisitions" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("requisition_items" as any).select("*"),
    ]);
    setSuppliers((s as any) || []);
    setPos((p as any) || []);
    setPoItems((pi as any) || []);
    setReceptions((r as any) || []);
    setReqs((rq as any) || []);
    setReqItems((ri as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const supplierName = (id: string | null) => id ? (suppliers.find(x=>x.id===id)?.name || "—") : "—";
  const itemsOf = (poId: string) => poItems.filter(i => i.purchase_order_id === poId);

  // PO CRUD
  const nextCode = (prefix: string, list: { code: string }[]) => {
    const nums = list.map(x => Number((x.code||"").split("-").pop())||0);
    return `${prefix}-${String(Math.max(0, ...nums)+1).padStart(4,"0")}`;
  };
  const newPo = () => {
    setEditPo({ id:"", code: nextCode("OC", pos), supplier_id: suppliers[0]?.id||null, work_order_id: null,
      title:"", currency:"PEN", subtotal:0, tax:0, total:0, status:"draft",
      expected_at:null, delivered_at:null, payment_terms:"", notes:"", created_at:"" } as any);
    setEditItems([]);
    setOpenPo(true);
  };
  const editExistingPo = (po: PO) => { setEditPo(po); setEditItems(itemsOf(po.id).map(i=>({...i}))); setOpenPo(true); };
  const savePo = async () => {
    if (!editPo) return;
    if (!editPo.title.trim()) { toast.error("Título requerido"); return; }
    const payload: any = { ...editPo }; delete payload.id; delete payload.created_at;
    payload.subtotal = editItems.reduce((a,i)=>a+Number(i.subtotal||0),0);
    payload.total = payload.subtotal + Number(editPo.tax||0);
    let poId = editPo.id;
    if (poId) {
      const { error } = await supabase.from("purchase_orders" as any).update(payload).eq("id", poId);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from("purchase_orders" as any).insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      poId = (data as any).id;
    }
    // Sync items: delete existing then insert
    await supabase.from("purchase_order_items" as any).delete().eq("purchase_order_id", poId);
    if (editItems.length) {
      const rows = editItems.map(i => ({
        purchase_order_id: poId, description: i.description, quantity: i.quantity,
        unit: i.unit, unit_price: i.unit_price, subtotal: Number(i.quantity)*Number(i.unit_price),
      }));
      const { error } = await supabase.from("purchase_order_items" as any).insert(rows);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Orden de compra guardada");
    setOpenPo(false); setEditPo(null); load();
  };
  const delPo = async (id: string) => {
    if (!confirm("¿Eliminar orden de compra?")) return;
    const { error } = await supabase.from("purchase_orders" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminada"); load();
  };
  const setPoStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("purchase_orders" as any).update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estado actualizado"); load();
  };

  // Reception
  const openReception = (po: PO) => {
    setRecPo(po);
    const items: Record<string,number> = {};
    itemsOf(po.id).forEach(i => { items[i.id] = Math.max(0, Number(i.quantity) - Number(i.received_qty)); });
    setRecDraft({ delivery_note:"", received_by:"", notes:"", items });
    setOpenRec(true);
  };
  const saveReception = async () => {
    if (!recPo) return;
    const entries = Object.entries(recDraft.items).filter(([,q]) => Number(q)>0);
    if (!entries.length) { toast.error("Ingresa al menos una cantidad recibida"); return; }
    const { data: rec, error } = await supabase.from("purchase_receptions" as any).insert({
      purchase_order_id: recPo.id, delivery_note: recDraft.delivery_note || null,
      received_by: recDraft.received_by || null, notes: recDraft.notes || null,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    const rows = entries.map(([po_item_id, quantity]) => ({ reception_id: (rec as any).id, po_item_id, quantity }));
    const { error: e2 } = await supabase.from("purchase_reception_items" as any).insert(rows);
    if (e2) { toast.error(e2.message); return; }
    toast.success("Recepción registrada");
    setOpenRec(false); setRecPo(null); load();
  };

  // Requisitions
  const newReq = () => {
    setEditReq({ id:"", code: nextCode("REQ", reqs), work_order_id:null, requester_name:"", status:"pending", notes:"", converted_po_id:null, created_at:"" } as any);
    setEditReqItems([]);
    setOpenReq(true);
  };
  const editExistingReq = (r: Req) => {
    setEditReq(r);
    setEditReqItems(reqItems.filter(i => i.requisition_id === r.id).map(i=>({...i})));
    setOpenReq(true);
  };
  const saveReq = async () => {
    if (!editReq) return;
    const payload: any = { ...editReq }; delete payload.id; delete payload.created_at;
    let reqId = editReq.id;
    if (reqId) {
      const { error } = await supabase.from("requisitions" as any).update(payload).eq("id", reqId);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      payload.requester_id = user?.id;
      const { data, error } = await supabase.from("requisitions" as any).insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      reqId = (data as any).id;
    }
    await supabase.from("requisition_items" as any).delete().eq("requisition_id", reqId);
    if (editReqItems.length) {
      const rows = editReqItems.map(i => ({ requisition_id: reqId, description: i.description, quantity: i.quantity, unit: i.unit, notes: i.notes||null }));
      const { error } = await supabase.from("requisition_items" as any).insert(rows);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Requisición guardada");
    setOpenReq(false); setEditReq(null); load();
  };
  const delReq = async (id: string) => {
    if (!confirm("¿Eliminar requisición?")) return;
    const { error } = await supabase.from("requisitions" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminada"); load();
  };
  const convertReqToPo = async (r: Req) => {
    if (r.converted_po_id) { toast.info("Ya está convertida"); return; }
    if (suppliers.length === 0) { toast.error("Crea un proveedor primero"); return; }
    const items = reqItems.filter(i => i.requisition_id === r.id);
    if (items.length === 0) { toast.error("La requisición no tiene ítems"); return; }
    const supplierId = prompt(`Elige un proveedor. Opciones:\n${suppliers.map((s,i)=>`${i+1}. ${s.name}`).join("\n")}\n\nEscribe el número:`);
    const idx = Number(supplierId)-1;
    if (isNaN(idx) || !suppliers[idx]) { toast.error("Proveedor inválido"); return; }
    const code = nextCode("OC", pos);
    const { data: po, error } = await supabase.from("purchase_orders" as any).insert({
      code, supplier_id: suppliers[idx].id, work_order_id: r.work_order_id,
      requisition_id: r.id, title: `Desde requisición ${r.code}`, status: "draft",
      notes: r.notes,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    const rows = items.map(i => ({
      purchase_order_id: (po as any).id, description: i.description,
      quantity: i.quantity, unit: i.unit, unit_price: 0, subtotal: 0,
    }));
    await supabase.from("purchase_order_items" as any).insert(rows);
    await supabase.from("requisitions" as any).update({ status: "converted", converted_po_id: (po as any).id }).eq("id", r.id);
    toast.success(`Convertida a OC ${code}`);
    load();
  };

  // Dashboard KPIs
  const kpis = useMemo(() => {
    const totalSpend = pos.filter(p=>!["cancelled","draft"].includes(p.status)).reduce((a,p)=>a+Number(p.total||0),0);
    const pending = pos.filter(p=>["sent","confirmed","partial"].includes(p.status)).length;
    const bySupplier: Record<string, number> = {};
    pos.forEach(p => { if (p.supplier_id && !["cancelled","draft"].includes(p.status)) bySupplier[p.supplier_id] = (bySupplier[p.supplier_id]||0)+Number(p.total||0); });
    const topSuppliers = Object.entries(bySupplier).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const deliveryDays: number[] = [];
    pos.forEach(p => {
      if (p.expected_at && p.delivered_at) {
        const d = (new Date(p.delivered_at).getTime() - new Date(p.expected_at).getTime())/(1000*60*60*24);
        deliveryDays.push(d);
      }
    });
    const avgDelay = deliveryDays.length ? (deliveryDays.reduce((a,b)=>a+b,0)/deliveryDays.length) : null;
    return { totalSpend, pending, topSuppliers, avgDelay };
  }, [pos]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant={tab==="pos"?"default":"outline"} onClick={()=>setTab("pos")}><ShoppingCart className="h-4 w-4 mr-1"/>Órdenes de compra</Button>
        <Button variant={tab==="receptions"?"default":"outline"} onClick={()=>setTab("receptions")}><PackageCheck className="h-4 w-4 mr-1"/>Recepciones</Button>
        <Button variant={tab==="requisitions"?"default":"outline"} onClick={()=>setTab("requisitions")}><FileEdit className="h-4 w-4 mr-1"/>Requisiciones</Button>
        <Button variant={tab==="dashboard"?"default":"outline"} onClick={()=>setTab("dashboard")}><TrendingUp className="h-4 w-4 mr-1"/>Panel</Button>
      </div>

      {tab === "pos" && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Órdenes de compra ({pos.length})</h3>
            <Button size="sm" onClick={newPo}><Plus className="h-4 w-4 mr-1"/>Nueva OC</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground text-xs uppercase">
                <tr><th className="p-3">Código</th><th className="p-3">Proveedor</th><th className="p-3">Título</th><th className="p-3">Total</th><th className="p-3">Estado</th><th className="p-3">Esperada</th><th className="p-3">Acciones</th></tr>
              </thead>
              <tbody>
                {pos.length===0 ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin órdenes</td></tr> :
                  pos.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3 font-mono text-xs">{p.code}</td>
                      <td className="p-3">{supplierName(p.supplier_id)}</td>
                      <td className="p-3">{p.title}</td>
                      <td className="p-3">{Number(p.total).toFixed(2)} {p.currency}</td>
                      <td className="p-3"><Badge variant={PO_COLORS[p.status] as any}>{PO_STATUS[p.status]}</Badge></td>
                      <td className="p-3 text-xs">{p.expected_at || "—"}</td>
                      <td className="p-3 whitespace-nowrap">
                        <Button size="icon" variant="ghost" onClick={()=>editExistingPo(p)} title="Editar"><Pencil className="h-4 w-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={()=>openReception(p)} title="Recibir" disabled={["draft","cancelled","received","invoiced"].includes(p.status)}><PackageCheck className="h-4 w-4"/></Button>
                        <Select value={p.status} onValueChange={(v)=>setPoStatus(p.id, v)}>
                          <SelectTrigger className="inline-flex h-8 w-28 ml-1"><SelectValue/></SelectTrigger>
                          <SelectContent>{Object.entries(PO_STATUS).map(([k,l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" onClick={()=>delPo(p.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "receptions" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Recepciones ({receptions.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground text-xs uppercase">
                <tr><th className="p-3">Fecha</th><th className="p-3">OC</th><th className="p-3">Nota remisión</th><th className="p-3">Recibido por</th><th className="p-3">Observaciones</th></tr>
              </thead>
              <tbody>
                {receptions.length===0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sin recepciones</td></tr> :
                  receptions.map(r => {
                    const po = pos.find(p => p.id === r.purchase_order_id);
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="p-3 text-xs">{format(parseISO(r.received_at), "dd/MM/yyyy")}</td>
                        <td className="p-3 font-mono text-xs">{po?.code || "—"}</td>
                        <td className="p-3">{r.delivery_note || "—"}</td>
                        <td className="p-3">{r.received_by || "—"}</td>
                        <td className="p-3 text-xs text-muted-foreground">{r.notes || "—"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "requisitions" && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Requisiciones ({reqs.length})</h3>
            <Button size="sm" onClick={newReq}><Plus className="h-4 w-4 mr-1"/>Nueva requisición</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground text-xs uppercase">
                <tr><th className="p-3">Código</th><th className="p-3">Solicitante</th><th className="p-3">Ítems</th><th className="p-3">Estado</th><th className="p-3">Fecha</th><th className="p-3">Acciones</th></tr>
              </thead>
              <tbody>
                {reqs.length===0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sin requisiciones</td></tr> :
                  reqs.map(r => {
                    const count = reqItems.filter(i => i.requisition_id === r.id).length;
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="p-3 font-mono text-xs">{r.code}</td>
                        <td className="p-3">{r.requester_name || "—"}</td>
                        <td className="p-3">{count}</td>
                        <td className="p-3"><Badge variant={r.status==="converted"?"default":r.status==="rejected"?"destructive":"outline"}>{REQ_STATUS[r.status]}</Badge></td>
                        <td className="p-3 text-xs">{format(parseISO(r.created_at), "dd/MM/yyyy")}</td>
                        <td className="p-3 whitespace-nowrap">
                          <Button size="icon" variant="ghost" onClick={()=>editExistingReq(r)}><Pencil className="h-4 w-4"/></Button>
                          <Button size="sm" variant="outline" onClick={()=>convertReqToPo(r)} disabled={r.status==="converted"} title="Convertir a OC">
                            <ArrowRight className="h-3 w-3 mr-1"/>OC
                          </Button>
                          <Button size="icon" variant="ghost" onClick={()=>delReq(r.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4"><p className="text-xs text-muted-foreground">Gasto total</p><p className="text-2xl font-bold">{kpis.totalSpend.toFixed(2)}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">OC pendientes</p><p className="text-2xl font-bold">{kpis.pending}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Requisiciones abiertas</p><p className="text-2xl font-bold">{reqs.filter(r=>r.status==="pending").length}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Desvío entrega (días)</p><p className="text-2xl font-bold">{kpis.avgDelay===null ? "—" : kpis.avgDelay.toFixed(1)}</p></Card>
          </div>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Top proveedores por gasto</h3>
            {kpis.topSuppliers.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos</p> : (
              <ul className="divide-y">
                {kpis.topSuppliers.map(([sid, total]) => (
                  <li key={sid} className="py-2 flex justify-between">
                    <span>{supplierName(sid)}</span>
                    <span className="font-mono">{total.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* PO Dialog */}
      <Dialog open={openPo} onOpenChange={(v)=>{setOpenPo(v); if(!v) setEditPo(null);}}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editPo?.id ? "Editar OC" : "Nueva OC"}</DialogTitle></DialogHeader>
          {editPo && (
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Código</Label><Input value={editPo.code} onChange={(e)=>setEditPo({...editPo, code: e.target.value})}/></div>
              <div><Label>Proveedor</Label>
                <Select value={editPo.supplier_id || ""} onValueChange={(v)=>setEditPo({...editPo, supplier_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Elegir…"/></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Título *</Label><Input value={editPo.title} onChange={(e)=>setEditPo({...editPo, title: e.target.value})}/></div>
              <div><Label>Moneda</Label>
                <Select value={editPo.currency} onValueChange={(v)=>setEditPo({...editPo, currency: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="PEN">PEN</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Fecha esperada</Label><Input type="date" value={editPo.expected_at||""} onChange={(e)=>setEditPo({...editPo, expected_at: e.target.value||null})}/></div>
              <div><Label>Impuestos</Label><Input type="number" step="0.01" value={editPo.tax} onChange={(e)=>setEditPo({...editPo, tax: Number(e.target.value)||0})}/></div>
              <div><Label>Estado</Label>
                <Select value={editPo.status} onValueChange={(v)=>setEditPo({...editPo, status: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(PO_STATUS).map(([k,l])=><SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Condiciones de pago</Label><Textarea rows={2} value={editPo.payment_terms||""} onChange={(e)=>setEditPo({...editPo, payment_terms: e.target.value})}/></div>
              <div className="md:col-span-2"><Label>Notas</Label><Textarea rows={2} value={editPo.notes||""} onChange={(e)=>setEditPo({...editPo, notes: e.target.value})}/></div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <Label>Ítems</Label>
                  <Button size="sm" variant="outline" onClick={()=>setEditItems([...editItems, { id:"", purchase_order_id: editPo.id, description:"", quantity:1, unit:"unid", unit_price:0, subtotal:0, received_qty:0 }])}>
                    <Plus className="h-3 w-3 mr-1"/>Añadir ítem
                  </Button>
                </div>
                <div className="space-y-2">
                  {editItems.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_80px_70px_100px_100px_auto] gap-2 items-center">
                      <Input placeholder="Descripción" value={it.description} onChange={(e)=>{ const c=[...editItems]; c[idx]={...c[idx], description: e.target.value}; setEditItems(c); }}/>
                      <Input type="number" step="0.001" value={it.quantity} onChange={(e)=>{ const c=[...editItems]; const q=Number(e.target.value)||0; c[idx]={...c[idx], quantity: q, subtotal: q*Number(c[idx].unit_price)}; setEditItems(c); }}/>
                      <Input placeholder="unid" value={it.unit} onChange={(e)=>{ const c=[...editItems]; c[idx]={...c[idx], unit: e.target.value}; setEditItems(c); }}/>
                      <Input type="number" step="0.01" placeholder="P. unit." value={it.unit_price} onChange={(e)=>{ const c=[...editItems]; const up=Number(e.target.value)||0; c[idx]={...c[idx], unit_price: up, subtotal: Number(c[idx].quantity)*up}; setEditItems(c); }}/>
                      <div className="text-sm font-mono text-right">{(Number(it.quantity)*Number(it.unit_price)).toFixed(2)}</div>
                      <Button size="icon" variant="ghost" onClick={()=>setEditItems(editItems.filter((_,i)=>i!==idx))}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    </div>
                  ))}
                  {editItems.length === 0 && <p className="text-xs text-muted-foreground italic">Sin ítems</p>}
                </div>
                <div className="mt-3 text-right text-sm">
                  Subtotal: <strong>{editItems.reduce((a,i)=>a+Number(i.quantity||0)*Number(i.unit_price||0),0).toFixed(2)}</strong> ·
                  Total: <strong>{(editItems.reduce((a,i)=>a+Number(i.quantity||0)*Number(i.unit_price||0),0)+Number(editPo.tax||0)).toFixed(2)}</strong> {editPo.currency}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenPo(false)}>Cancelar</Button>
            <Button onClick={savePo}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reception Dialog */}
      <Dialog open={openRec} onOpenChange={(v)=>{setOpenRec(v); if(!v) setRecPo(null);}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Recibir mercadería — {recPo?.code}</DialogTitle></DialogHeader>
          {recPo && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Nota de remisión</Label><Input value={recDraft.delivery_note} onChange={(e)=>setRecDraft({...recDraft, delivery_note: e.target.value})}/></div>
                <div><Label>Recibido por</Label><Input value={recDraft.received_by} onChange={(e)=>setRecDraft({...recDraft, received_by: e.target.value})}/></div>
              </div>
              <div><Label>Observaciones</Label><Textarea rows={2} value={recDraft.notes} onChange={(e)=>setRecDraft({...recDraft, notes: e.target.value})}/></div>
              <div>
                <Label>Cantidades recibidas</Label>
                <table className="w-full text-sm mt-2">
                  <thead className="text-left text-xs text-muted-foreground"><tr><th className="p-2">Ítem</th><th className="p-2">Pedido</th><th className="p-2">Ya recibido</th><th className="p-2">Recibir ahora</th></tr></thead>
                  <tbody>
                    {itemsOf(recPo.id).map(i => (
                      <tr key={i.id} className="border-t">
                        <td className="p-2">{i.description}</td>
                        <td className="p-2">{Number(i.quantity).toFixed(2)} {i.unit}</td>
                        <td className="p-2">{Number(i.received_qty).toFixed(2)}</td>
                        <td className="p-2">
                          <Input type="number" step="0.001" className="w-24" value={recDraft.items[i.id] ?? 0}
                            onChange={(e)=>setRecDraft({...recDraft, items: {...recDraft.items, [i.id]: Number(e.target.value)||0}})}/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenRec(false)}>Cancelar</Button>
            <Button onClick={saveReception}>Registrar recepción</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requisition Dialog */}
      <Dialog open={openReq} onOpenChange={(v)=>{setOpenReq(v); if(!v) setEditReq(null);}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editReq?.id ? "Editar requisición" : "Nueva requisición"}</DialogTitle></DialogHeader>
          {editReq && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Código</Label><Input value={editReq.code} onChange={(e)=>setEditReq({...editReq, code: e.target.value})}/></div>
                <div><Label>Solicitante</Label><Input value={editReq.requester_name||""} onChange={(e)=>setEditReq({...editReq, requester_name: e.target.value})}/></div>
              </div>
              <div><Label>Estado</Label>
                <Select value={editReq.status} onValueChange={(v)=>setEditReq({...editReq, status: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(REQ_STATUS).map(([k,l])=><SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notas</Label><Textarea rows={2} value={editReq.notes||""} onChange={(e)=>setEditReq({...editReq, notes: e.target.value})}/></div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Ítems solicitados</Label>
                  <Button size="sm" variant="outline" onClick={()=>setEditReqItems([...editReqItems, { id:"", requisition_id: editReq.id, description:"", quantity:1, unit:"unid", notes:"" }])}>
                    <Plus className="h-3 w-3 mr-1"/>Añadir
                  </Button>
                </div>
                <div className="space-y-2">
                  {editReqItems.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_80px_80px_auto] gap-2">
                      <Input placeholder="Descripción" value={it.description} onChange={(e)=>{ const c=[...editReqItems]; c[idx]={...c[idx], description: e.target.value}; setEditReqItems(c); }}/>
                      <Input type="number" step="0.001" value={it.quantity} onChange={(e)=>{ const c=[...editReqItems]; c[idx]={...c[idx], quantity: Number(e.target.value)||0}; setEditReqItems(c); }}/>
                      <Input placeholder="unid" value={it.unit} onChange={(e)=>{ const c=[...editReqItems]; c[idx]={...c[idx], unit: e.target.value}; setEditReqItems(c); }}/>
                      <Button size="icon" variant="ghost" onClick={()=>setEditReqItems(editReqItems.filter((_,i)=>i!==idx))}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    </div>
                  ))}
                  {editReqItems.length === 0 && <p className="text-xs text-muted-foreground italic">Sin ítems</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenReq(false)}>Cancelar</Button>
            <Button onClick={saveReq}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
