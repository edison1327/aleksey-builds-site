import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Send, Trash2, Copy, Trophy, Eye, Sparkles } from "lucide-react";

interface Rfq {
  id: string; code: string; title: string; description: string | null;
  category: string | null; currency: string; deadline: string | null;
  status: string; awarded_response_id: string | null; notes: string | null;
  created_at: string;
}
interface Supplier { id: string; name: string; email: string | null; }

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  closed: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  awarded: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-destructive/15 text-destructive",
};

const AdminRfqs = () => {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [detail, setDetail] = useState<Rfq | null>(null);
  const { toast } = useToast();

  // New RFQ form
  const [form, setForm] = useState({
    title: "", description: "", category: "", currency: "PEN",
    deadline: "", notes: "",
  });
  const [items, setItems] = useState<{ description: string; quantity: number; unit: string; specifications: string }[]>([
    { description: "", quantity: 1, unit: "unidad", specifications: "" },
  ]);

  // Detail state
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailInvites, setDetailInvites] = useState<any[]>([]);
  const [detailResponses, setDetailResponses] = useState<any[]>([]);
  const [invitePick, setInvitePick] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: s }] = await Promise.all([
      (supabase as any).from("rfqs").select("*").order("created_at", { ascending: false }),
      supabase.from("suppliers").select("id,name,email").order("name"),
    ]);
    setRfqs(r || []);
    setSuppliers((s as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const [detailGami, setDetailGami] = useState<Record<string, any>>({});

  const loadDetail = async (rfq: Rfq) => {
    setDetail(rfq);
    const [it, inv, resp] = await Promise.all([
      (supabase as any).from("rfq_items").select("*").eq("rfq_id", rfq.id).order("sort_order"),
      (supabase as any).from("rfq_invitations").select("*, suppliers(name,email)").eq("rfq_id", rfq.id),
      (supabase as any).from("rfq_responses").select("*, suppliers(name,email)").eq("rfq_id", rfq.id).order("total_amount"),
    ]);
    setDetailItems(it.data || []);
    setDetailInvites(inv.data || []);
    setDetailResponses(resp.data || []);
    const supplierIds = Array.from(new Set((resp.data || []).map((r: any) => r.supplier_id).filter(Boolean)));
    if (supplierIds.length) {
      const { data: g } = await (supabase as any).rpc("get_supplier_gamification", { _supplier_id: null });
      const map: Record<string, any> = {};
      (g || []).forEach((row: any) => { if (supplierIds.includes(row.supplier_id)) map[row.supplier_id] = row; });
      setDetailGami(map);
    } else {
      setDetailGami({});
    }
  };

  const createRfq = async () => {
    if (!form.title.trim() || items.some((i) => !i.description.trim())) {
      toast({ title: "Completa el formulario", variant: "destructive" });
      return;
    }
    const { data: rfq, error } = await (supabase as any).from("rfqs").insert({
      title: form.title, description: form.description || null,
      category: form.category || null, currency: form.currency,
      deadline: form.deadline || null, notes: form.notes || null,
    }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const rows = items.map((it, i) => ({
      rfq_id: rfq.id, description: it.description, quantity: it.quantity,
      unit: it.unit, specifications: it.specifications || null, sort_order: i,
    }));
    await (supabase as any).from("rfq_items").insert(rows);
    toast({ title: "RFQ creada", description: rfq.code });
    setOpenNew(false);
    setForm({ title: "", description: "", category: "", currency: "PEN", deadline: "", notes: "" });
    setItems([{ description: "", quantity: 1, unit: "unidad", specifications: "" }]);
    load();
  };

  const inviteSupplier = async () => {
    if (!detail || !invitePick) return;
    const { error } = await (supabase as any).from("rfq_invitations").insert({
      rfq_id: detail.id, supplier_id: invitePick,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setInvitePick("");
    loadDetail(detail);
  };

  const autoInviteTop = async () => {
    if (!detail) return;
    const { data, error } = await (supabase as any).rpc("auto_invite_top_suppliers", {
      _rfq_id: detail.id, _limit: 5,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({
      title: data > 0 ? `${data} proveedores invitados` : "Sin nuevos proveedores",
      description: data > 0
        ? `Se invitó automáticamente al top ${data} de la categoría "${detail.category || "general"}".`
        : "Todos los top-rated ya estaban invitados o no hay proveedores en esa categoría.",
    });
    loadDetail(detail);
  };

  const sendRfq = async () => {
    if (!detail) return;
    await (supabase as any).from("rfqs").update({ status: "sent" }).eq("id", detail.id);
    await (supabase as any).from("rfq_invitations").update({ sent_at: new Date().toISOString() }).eq("rfq_id", detail.id).is("sent_at", null);
    toast({ title: "RFQ enviada", description: "Los proveedores ya pueden cotizar." });
    loadDetail({ ...detail, status: "sent" });
    load();
  };

  const closeRfq = async () => {
    if (!detail) return;
    await (supabase as any).from("rfqs").update({ status: "closed" }).eq("id", detail.id);
    loadDetail({ ...detail, status: "closed" });
    load();
  };

  const award = async (responseId: string) => {
    if (!detail) return;
    await (supabase as any).from("rfqs").update({ status: "awarded", awarded_response_id: responseId }).eq("id", detail.id);
    await (supabase as any).from("rfq_responses").update({ status: "awarded" }).eq("id", responseId);
    await (supabase as any).from("rfq_responses").update({ status: "rejected" }).eq("rfq_id", detail.id).neq("id", responseId);
    toast({ title: "Adjudicada" });
    loadDetail({ ...detail, status: "awarded", awarded_response_id: responseId });
    load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/rfq/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Enlace copiado", description: url });
  };

  const delRfq = async (id: string) => {
    if (!confirm("¿Eliminar RFQ?")) return;
    await (supabase as any).from("rfqs").delete().eq("id", id);
    load();
  };

  const availableSuppliers = useMemo(
    () => suppliers.filter((s) => !detailInvites.some((i) => i.supplier_id === s.id)),
    [suppliers, detailInvites],
  );

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">RFQs — Portal proveedores</h2>
          <p className="text-muted-foreground">Solicita cotizaciones y compara respuestas</p>
        </div>
        <Button onClick={() => setOpenNew(true)} className="gap-2"><Plus className="h-4 w-4" /> Nueva RFQ</Button>
      </div>

      <div className="grid gap-3">
        {rfqs.length === 0 && <p className="text-sm text-muted-foreground">No hay solicitudes todavía.</p>}
        {rfqs.map((r) => (
          <Card key={r.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{r.code}</span>
                  <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                </div>
                <div className="font-semibold truncate">{r.title}</div>
                {r.deadline && <div className="text-xs text-muted-foreground">Cierra: {new Date(r.deadline).toLocaleDateString()}</div>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => loadDetail(r)}><Eye className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => delRfq(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New RFQ */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva solicitud de cotización</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
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

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ítems solicitados</Label>
                <Button size="sm" variant="outline" onClick={() => setItems([...items, { description: "", quantity: 1, unit: "unidad", specifications: "" }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Ítem
                </Button>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border rounded p-2">
                  <div className="col-span-5"><Label className="text-xs">Descripción</Label><Input value={it.description} onChange={(e) => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} /></div>
                  <div className="col-span-2"><Label className="text-xs">Cantidad</Label><Input type="number" step="0.01" value={it.quantity} onChange={(e) => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} /></div>
                  <div className="col-span-2"><Label className="text-xs">Unidad</Label><Input value={it.unit} onChange={(e) => { const n = [...items]; n[idx].unit = e.target.value; setItems(n); }} /></div>
                  <div className="col-span-2"><Label className="text-xs">Specs</Label><Input value={it.specifications} onChange={(e) => { const n = [...items]; n[idx].specifications = e.target.value; setItems(n); }} /></div>
                  <div className="col-span-1"><Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={createRfq}>Crear RFQ</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detail.code} — {detail.title}
                  <Badge className={STATUS_COLORS[detail.status]}>{detail.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {detail.status === "draft" && (
                  <div className="flex gap-2 justify-end">
                    <Button onClick={sendRfq} className="gap-2" disabled={detailInvites.length === 0}>
                      <Send className="h-4 w-4" /> Enviar a proveedores
                    </Button>
                  </div>
                )}
                {detail.status === "sent" && (
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={closeRfq}>Cerrar convocatoria</Button>
                  </div>
                )}

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Ítems ({detailItems.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {detailItems.map((it: any) => (
                      <div key={it.id} className="flex justify-between border-b py-1">
                        <span>{it.description}</span>
                        <span className="text-muted-foreground">{it.quantity} {it.unit}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Proveedores invitados ({detailInvites.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {detail.status === "draft" && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Select value={invitePick} onValueChange={setInvitePick}>
                            <SelectTrigger className="flex-1"><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger>
                            <SelectContent>
                              {availableSuppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button onClick={inviteSupplier} disabled={!invitePick}>Invitar</Button>
                        </div>
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={autoInviteTop}>
                          <Sparkles className="h-3.5 w-3.5" />
                          Invitar top 5 proveedores{detail.category ? ` de "${detail.category}"` : " por rating"}
                        </Button>
                      </div>
                    )}
                    {detailInvites.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between border rounded px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{inv.suppliers?.name}</div>
                          <div className="text-xs text-muted-foreground">{inv.suppliers?.email || "—"} · <Badge variant="outline">{inv.status}</Badge></div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => copyLink(inv.access_token)}>
                          <Copy className="h-3.5 w-3.5" /> Copiar enlace
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Comparativa de cotizaciones ({detailResponses.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {detailResponses.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay cotizaciones.</p>}
                    {detailResponses.length > 0 && (() => {
                      const prices = detailResponses.map((r:any)=>Number(r.total_amount||0));
                      const minPrice = Math.min(...prices);
                      const maxPrice = Math.max(...prices);
                      const deliveries = detailResponses.map((r:any)=>Number(r.delivery_days||9999));
                      const minDelivery = Math.min(...deliveries);
                      const scored = detailResponses.map((r:any) => {
                        const g = detailGami[r.supplier_id];
                        const priceScore = maxPrice === minPrice ? 1 : 1 - (Number(r.total_amount)-minPrice)/(maxPrice-minPrice);
                        const delivScore = Number(r.delivery_days||9999) === minDelivery ? 1 : minDelivery/Number(r.delivery_days||9999);
                        const trustScore = Math.min(1, (Number(g?.points||0) + Number(g?.rating||0)*10) / 120);
                        const total = priceScore*0.5 + delivScore*0.25 + trustScore*0.25;
                        return { r, total };
                      });
                      const recommendedId = scored.slice().sort((a,b)=>b.total-a.total)[0]?.r.id;
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="text-left border-b">
                                <th className="p-2">Proveedor</th>
                                <th className="p-2">Total</th>
                                <th className="p-2">Entrega</th>
                                <th className="p-2">Pago</th>
                                <th className="p-2">Válida</th>
                                <th className="p-2">Nivel</th>
                                <th className="p-2">Rating</th>
                                <th className="p-2">Score</th>
                                <th className="p-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {scored.map(({ r, total }) => {
                                const isAwarded = detail.awarded_response_id === r.id;
                                const isCheapest = Number(r.total_amount) === minPrice;
                                const isFastest = Number(r.delivery_days||9999) === minDelivery;
                                const isRecommended = r.id === recommendedId && !isAwarded && detail.status !== "awarded";
                                const g = detailGami[r.supplier_id];
                                return (
                                  <tr key={r.id} className={`border-b ${isAwarded ? "bg-emerald-500/10" : isRecommended ? "bg-blue-500/5" : ""}`}>
                                    <td className="p-2">
                                      <div className="font-semibold">{r.suppliers?.name}</div>
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        {isAwarded && <Badge className="bg-emerald-500/20 text-emerald-700 text-[10px]"><Trophy className="h-3 w-3 mr-0.5"/>Adjudicada</Badge>}
                                        {isRecommended && <Badge className="bg-blue-500/20 text-blue-700 text-[10px]"><Sparkles className="h-3 w-3 mr-0.5"/>Recomendada</Badge>}
                                        {isCheapest && !isAwarded && <Badge variant="outline" className="text-[10px]">💰 Más barata</Badge>}
                                        {isFastest && !isAwarded && <Badge variant="outline" className="text-[10px]">⚡ Más rápida</Badge>}
                                      </div>
                                    </td>
                                    <td className="p-2 font-bold whitespace-nowrap">{r.currency} {Number(r.total_amount).toFixed(2)}</td>
                                    <td className="p-2 whitespace-nowrap">{r.delivery_days ?? "—"} d</td>
                                    <td className="p-2 text-xs">{r.payment_terms || "—"}</td>
                                    <td className="p-2 text-xs">{r.validity_days} d</td>
                                    <td className="p-2 text-xs">{g?.tier || "—"}</td>
                                    <td className="p-2 text-xs">{g ? `${Number(g.rating).toFixed(1)}★ (${g.evaluations_count})` : "—"}</td>
                                    <td className="p-2">
                                      <div className="flex items-center gap-1">
                                        <div className="h-2 w-16 bg-muted rounded overflow-hidden">
                                          <div className="h-full bg-primary" style={{ width: `${Math.round(total*100)}%` }} />
                                        </div>
                                        <span className="text-xs">{Math.round(total*100)}</span>
                                      </div>
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                      {detail.status !== "awarded" && (
                                        <Button size="sm" variant={isRecommended ? "default" : "outline"} className="gap-1" onClick={() => award(r.id)}>
                                          <Trophy className="h-3.5 w-3.5" /> Adjudicar
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <p className="text-[11px] text-muted-foreground mt-2">Score = 50% precio + 25% tiempo de entrega + 25% confianza del proveedor.</p>
                        </div>
                      );
                    })()}
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

export default AdminRfqs;
