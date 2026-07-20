import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Eye, Users2, Send, Layers } from "lucide-react";

interface Pool {
  id: string; code: string; title: string; category: string | null;
  currency: string; status: string; deadline: string | null;
  notes: string | null; rfq_id: string | null; created_at: string;
}
interface Branch { id: string; name: string; }

const STATUS_COLORS: Record<string, string> = {
  collecting: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  rfq_sent: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  awarded: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

const AdminPools = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [detail, setDetail] = useState<Pool | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({ title: "", category: "", currency: "PEN", deadline: "", notes: "" });
  const [items, setItems] = useState<{ description: string; unit: string; target_price: string; specifications: string }[]>([
    { description: "", unit: "unidad", target_price: "", specifications: "" },
  ]);

  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailContribs, setDetailContribs] = useState<any[]>([]);
  const [contribForm, setContribForm] = useState({ pool_item_id: "", branch_id: "", quantity: 1, requested_by: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: b }] = await Promise.all([
      (supabase as any).from("purchase_pools").select("*").order("created_at", { ascending: false }),
      supabase.from("branches").select("id,name").order("name"),
    ]);
    setPools(p || []);
    setBranches((b as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadDetail = async (pool: Pool) => {
    setDetail(pool);
    const [it, cn] = await Promise.all([
      (supabase as any).from("purchase_pool_items").select("*").eq("pool_id", pool.id).order("sort_order"),
      (supabase as any).from("purchase_pool_contributions").select("*, branches(name)").eq("pool_id", pool.id).order("created_at", { ascending: false }),
    ]);
    setDetailItems(it.data || []);
    setDetailContribs(cn.data || []);
    setContribForm({ pool_item_id: (it.data?.[0]?.id) || "", branch_id: "", quantity: 1, requested_by: "", notes: "" });
  };

  const createPool = async () => {
    if (!form.title.trim() || items.some(i => !i.description.trim())) {
      toast({ title: "Completa el formulario", variant: "destructive" }); return;
    }
    const { data: pool, error } = await (supabase as any).from("purchase_pools").insert({
      title: form.title, category: form.category || null, currency: form.currency,
      deadline: form.deadline || null, notes: form.notes || null,
    }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const rows = items.map((it, i) => ({
      pool_id: pool.id, description: it.description, unit: it.unit,
      target_price: it.target_price ? Number(it.target_price) : null,
      specifications: it.specifications || null, sort_order: i,
    }));
    await (supabase as any).from("purchase_pool_items").insert(rows);
    toast({ title: "Pool creado", description: pool.code });
    setOpenNew(false);
    setForm({ title: "", category: "", currency: "PEN", deadline: "", notes: "" });
    setItems([{ description: "", unit: "unidad", target_price: "", specifications: "" }]);
    load();
  };

  const addContribution = async () => {
    if (!detail || !contribForm.pool_item_id || !contribForm.quantity) return;
    const { error } = await (supabase as any).from("purchase_pool_contributions").insert({
      pool_id: detail.id,
      pool_item_id: contribForm.pool_item_id,
      branch_id: contribForm.branch_id || null,
      quantity: contribForm.quantity,
      requested_by: contribForm.requested_by || null,
      notes: contribForm.notes || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contribución agregada" });
    loadDetail(detail);
  };

  const delContribution = async (id: string) => {
    await (supabase as any).from("purchase_pool_contributions").delete().eq("id", id);
    if (detail) loadDetail(detail);
  };

  const convertToRfq = async () => {
    if (!detail) return;
    if (!confirm("¿Convertir este pool en una RFQ y enviarlo a proveedores?")) return;
    const { data, error } = await (supabase as any).rpc("convert_pool_to_rfq", { _pool_id: detail.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "RFQ creada", description: "Ve al panel de RFQs para invitar proveedores." });
    loadDetail({ ...detail, status: "rfq_sent", rfq_id: data });
    load();
  };

  const closePool = async () => {
    if (!detail) return;
    await (supabase as any).from("purchase_pools").update({ status: "closed" }).eq("id", detail.id);
    loadDetail({ ...detail, status: "closed" });
    load();
  };

  const delPool = async (id: string) => {
    if (!confirm("¿Eliminar pool?")) return;
    await (supabase as any).from("purchase_pools").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2"><Layers className="h-6 w-6" /> Pool de compras consolidadas</h2>
          <p className="text-muted-foreground">Agrupa demanda de varias sucursales y negocia mejor precio</p>
        </div>
        <Button onClick={() => setOpenNew(true)} className="gap-2"><Plus className="h-4 w-4" /> Nuevo pool</Button>
      </div>

      <div className="grid gap-3">
        {pools.length === 0 && <p className="text-sm text-muted-foreground">No hay pools todavía.</p>}
        {pools.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{p.code}</span>
                  <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
                  {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
                </div>
                <div className="font-semibold truncate">{p.title}</div>
                {p.deadline && <div className="text-xs text-muted-foreground">Cierra: {new Date(p.deadline).toLocaleDateString()}</div>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => loadDetail(p)}><Eye className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => delPool(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New pool */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo pool de compras</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Compra consolidada de EPP Q1" /></div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label>Categoría</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Moneda</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PEN">PEN</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Cierre</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            </div>
            <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ítems del pool</Label>
                <Button size="sm" variant="outline" onClick={() => setItems([...items, { description: "", unit: "unidad", target_price: "", specifications: "" }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Ítem
                </Button>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border rounded p-2">
                  <div className="col-span-5"><Label className="text-xs">Descripción</Label><Input value={it.description} onChange={(e) => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} /></div>
                  <div className="col-span-2"><Label className="text-xs">Unidad</Label><Input value={it.unit} onChange={(e) => { const n = [...items]; n[idx].unit = e.target.value; setItems(n); }} /></div>
                  <div className="col-span-2"><Label className="text-xs">Precio obj.</Label><Input type="number" step="0.01" value={it.target_price} onChange={(e) => { const n = [...items]; n[idx].target_price = e.target.value; setItems(n); }} /></div>
                  <div className="col-span-2"><Label className="text-xs">Specs</Label><Input value={it.specifications} onChange={(e) => { const n = [...items]; n[idx].specifications = e.target.value; setItems(n); }} /></div>
                  <div className="col-span-1"><Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">La cantidad total se calcula automáticamente a medida que las sucursales aportan.</p>
            </div>
            <Button className="w-full" onClick={createPool}>Crear pool</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {detail.code} — {detail.title}
                  <Badge className={STATUS_COLORS[detail.status]}>{detail.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div className="flex gap-2 justify-end flex-wrap">
                  {detail.status === "collecting" && (
                    <>
                      <Button onClick={convertToRfq} className="gap-2" disabled={detailItems.length === 0}>
                        <Send className="h-4 w-4" /> Convertir a RFQ
                      </Button>
                      <Button variant="outline" onClick={closePool}>Cerrar pool</Button>
                    </>
                  )}
                  {detail.rfq_id && (
                    <Button variant="outline" onClick={() => { window.location.hash = "rfqs"; }}>
                      Ver RFQ generada →
                    </Button>
                  )}
                </div>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Ítems del pool ({detailItems.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="p-2">Descripción</th>
                            <th className="p-2">Unidad</th>
                            <th className="p-2 text-right">Cantidad total</th>
                            <th className="p-2 text-right">Precio obj.</th>
                            <th className="p-2 text-right">Contribuciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailItems.map((it: any) => {
                            const contribs = detailContribs.filter((c: any) => c.pool_item_id === it.id);
                            const branches = new Set(contribs.map((c: any) => c.branch_id).filter(Boolean));
                            return (
                              <tr key={it.id} className="border-b">
                                <td className="p-2">
                                  <div className="font-medium">{it.description}</div>
                                  {it.specifications && <div className="text-xs text-muted-foreground">{it.specifications}</div>}
                                </td>
                                <td className="p-2">{it.unit}</td>
                                <td className="p-2 text-right font-bold">{Number(it.total_quantity).toFixed(2)}</td>
                                <td className="p-2 text-right text-muted-foreground">{it.target_price ? `${detail.currency} ${Number(it.target_price).toFixed(2)}` : "—"}</td>
                                <td className="p-2 text-right text-xs">
                                  <div className="flex items-center gap-1 justify-end">
                                    <Users2 className="h-3 w-3" /> {contribs.length} · {branches.size} sucursales
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {detail.status === "collecting" && detailItems.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Agregar contribución</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label className="text-xs">Ítem</Label>
                          <Select value={contribForm.pool_item_id} onValueChange={(v) => setContribForm({ ...contribForm, pool_item_id: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {detailItems.map((it: any) => <SelectItem key={it.id} value={it.id}>{it.description}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Sucursal</Label>
                          <Select value={contribForm.branch_id} onValueChange={(v) => setContribForm({ ...contribForm, branch_id: v })}>
                            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Cantidad</Label>
                          <Input type="number" step="0.01" value={contribForm.quantity}
                                 onChange={(e) => setContribForm({ ...contribForm, quantity: Number(e.target.value) })} />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Solicitante</Label>
                          <Input value={contribForm.requested_by} onChange={(e) => setContribForm({ ...contribForm, requested_by: e.target.value })} />
                        </div>
                        <div className="col-span-1">
                          <Button className="w-full" onClick={addContribution} disabled={!contribForm.pool_item_id}>+</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Contribuciones ({detailContribs.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {detailContribs.length === 0 && <p className="text-xs text-muted-foreground">Sin contribuciones aún.</p>}
                    {detailContribs.map((c: any) => {
                      const it = detailItems.find((i: any) => i.id === c.pool_item_id);
                      return (
                        <div key={c.id} className="flex items-center justify-between border-b py-1.5">
                          <div>
                            <div className="font-medium">{it?.description || "?"} — {Number(c.quantity).toFixed(2)} {it?.unit}</div>
                            <div className="text-xs text-muted-foreground">
                              {c.branches?.name || "Sin sucursal"}
                              {c.requested_by && ` · ${c.requested_by}`}
                            </div>
                          </div>
                          {detail.status === "collecting" && (
                            <Button size="icon" variant="ghost" onClick={() => delContribution(c.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPools;
