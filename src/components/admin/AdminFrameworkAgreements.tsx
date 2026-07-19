import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, FileSpreadsheet, AlertTriangle } from "lucide-react";

type Supplier = { id: string; name: string; category: string | null };
type Agreement = {
  id: string;
  code: string;
  title: string;
  supplier_id: string;
  category: string | null;
  currency: string;
  start_date: string;
  end_date: string;
  max_amount: number | null;
  min_amount: number | null;
  consumed_amount: number;
  payment_terms: string | null;
  delivery_terms: string | null;
  status: string;
  notes: string | null;
  suppliers?: { name: string } | null;
};
type Item = {
  id?: string;
  agreement_id?: string;
  description: string;
  sku: string | null;
  unit: string;
  unit_price: number;
  min_quantity: number | null;
  max_quantity: number | null;
  consumed_quantity?: number;
  lead_time_days: number | null;
  notes: string | null;
  sort_order: number;
};

const emptyForm = (): Partial<Agreement> => ({
  code: "",
  title: "",
  supplier_id: "",
  category: "",
  currency: "PEN",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  max_amount: null,
  min_amount: null,
  payment_terms: "",
  delivery_terms: "",
  status: "draft",
  notes: "",
});

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  expired: "bg-destructive/10 text-destructive",
  exhausted: "bg-orange-500/10 text-orange-600",
  cancelled: "bg-muted text-muted-foreground",
};

export default function AdminFrameworkAgreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Agreement> | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [a, s] = await Promise.all([
      supabase
        .from("framework_agreements")
        .select("*, suppliers(name)")
        .order("end_date", { ascending: true }),
      supabase.from("suppliers").select("id,name,category").eq("status", "active").order("name"),
    ]);
    if (a.error) toast.error(a.error.message);
    else setAgreements((a.data as any) || []);
    if (!s.error) setSuppliers((s.data as any) || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(emptyForm());
    setItems([]);
    setDialogOpen(true);
  }

  async function openEdit(a: Agreement) {
    setEditing(a);
    const { data } = await supabase
      .from("framework_agreement_items")
      .select("*")
      .eq("agreement_id", a.id)
      .order("sort_order");
    setItems((data as any) || []);
    setDialogOpen(true);
  }

  function addItem() {
    setItems((p) => [
      ...p,
      {
        description: "",
        sku: null,
        unit: "und",
        unit_price: 0,
        min_quantity: null,
        max_quantity: null,
        lead_time_days: null,
        notes: null,
        sort_order: p.length,
      },
    ]);
  }

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((p) => p.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!editing?.code || !editing?.title || !editing?.supplier_id) {
      toast.error("Código, título y proveedor son obligatorios");
      return;
    }
    const payload = {
      code: editing.code,
      title: editing.title,
      supplier_id: editing.supplier_id,
      category: editing.category || null,
      currency: editing.currency || "PEN",
      start_date: editing.start_date,
      end_date: editing.end_date,
      max_amount: editing.max_amount,
      min_amount: editing.min_amount,
      payment_terms: editing.payment_terms || null,
      delivery_terms: editing.delivery_terms || null,
      status: editing.status || "draft",
      notes: editing.notes || null,
    };

    let agreementId = (editing as Agreement).id;
    if (agreementId) {
      const { error } = await supabase.from("framework_agreements").update(payload).eq("id", agreementId);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("framework_agreements").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      agreementId = data.id;
    }

    // sync items: delete removed, upsert current
    const { data: existing } = await supabase
      .from("framework_agreement_items")
      .select("id")
      .eq("agreement_id", agreementId);
    const keepIds = items.filter((i) => i.id).map((i) => i.id);
    const toDelete = (existing || []).filter((e) => !keepIds.includes(e.id)).map((e) => e.id);
    if (toDelete.length) {
      await supabase.from("framework_agreement_items").delete().in("id", toDelete);
    }
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const row = {
        agreement_id: agreementId,
        description: it.description,
        sku: it.sku,
        unit: it.unit || "und",
        unit_price: Number(it.unit_price) || 0,
        min_quantity: it.min_quantity,
        max_quantity: it.max_quantity,
        lead_time_days: it.lead_time_days,
        notes: it.notes,
        sort_order: idx,
      };
      if (it.id) await supabase.from("framework_agreement_items").update(row).eq("id", it.id);
      else await supabase.from("framework_agreement_items").insert(row);
    }

    toast.success("Contrato marco guardado");
    setDialogOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este contrato marco?")) return;
    const { error } = await supabase.from("framework_agreements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  }

  const filtered = agreements.filter((a) => {
    if (tab === "all") return true;
    if (tab === "expiring") {
      const days = Math.floor((new Date(a.end_date).getTime() - Date.now()) / 86400000);
      return a.status === "active" && days <= 30 && days >= 0;
    }
    return a.status === tab;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Contratos Marco
            </CardTitle>
            <CardDescription>
              Acuerdos de precio y condiciones pactados con proveedores para compras recurrentes.
            </CardDescription>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Todos ({agreements.length})</TabsTrigger>
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="expiring">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Por vencer
              </TabsTrigger>
              <TabsTrigger value="draft">Borradores</TabsTrigger>
              <TabsTrigger value="expired">Vencidos</TabsTrigger>
              <TabsTrigger value="exhausted">Agotados</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              {loading ? (
                <div className="text-sm text-muted-foreground">Cargando...</div>
              ) : filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">Sin contratos</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Vigencia</TableHead>
                      <TableHead>Consumo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => {
                      const pct =
                        a.max_amount && a.max_amount > 0
                          ? Math.min(100, (Number(a.consumed_amount) / Number(a.max_amount)) * 100)
                          : 0;
                      const daysLeft = Math.floor(
                        (new Date(a.end_date).getTime() - Date.now()) / 86400000,
                      );
                      return (
                        <TableRow key={a.id} className="cursor-pointer" onClick={() => openEdit(a)}>
                          <TableCell className="font-mono text-xs">{a.code}</TableCell>
                          <TableCell>{a.title}</TableCell>
                          <TableCell>{a.suppliers?.name || "—"}</TableCell>
                          <TableCell className="text-xs">
                            {a.start_date} → {a.end_date}
                            {daysLeft >= 0 && daysLeft <= 30 && a.status === "active" && (
                              <div className="text-orange-600">{daysLeft}d restantes</div>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[160px]">
                            {a.max_amount ? (
                              <div>
                                <div className="text-xs mb-1">
                                  {Number(a.consumed_amount).toFixed(2)} / {Number(a.max_amount).toFixed(2)}{" "}
                                  {a.currency}
                                </div>
                                <Progress value={pct} className="h-2" />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin tope</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColor[a.status] || ""}>{a.status}</Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(editing as Agreement)?.id ? "Editar contrato marco" : "Nuevo contrato marco"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label>Código*</Label>
                  <Input
                    value={editing.code || ""}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                    placeholder="FA-2026-001"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Título*</Label>
                  <Input
                    value={editing.title || ""}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Proveedor*</Label>
                  <Select
                    value={editing.supplier_id || ""}
                    onValueChange={(v) => setEditing({ ...editing, supplier_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Input
                    value={editing.category || ""}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Moneda</Label>
                  <Select
                    value={editing.currency || "PEN"}
                    onValueChange={(v) => setEditing({ ...editing, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">PEN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Inicio*</Label>
                  <Input
                    type="date"
                    value={editing.start_date || ""}
                    onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fin*</Label>
                  <Input
                    type="date"
                    value={editing.end_date || ""}
                    onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={editing.status || "draft"}
                    onValueChange={(v) => setEditing({ ...editing, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="expired">Vencido</SelectItem>
                      <SelectItem value="exhausted">Agotado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Monto mínimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editing.min_amount ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        min_amount: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Monto máximo (tope)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editing.max_amount ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        max_amount: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-3">
                  <Label>Condiciones de pago</Label>
                  <Input
                    value={editing.payment_terms || ""}
                    onChange={(e) => setEditing({ ...editing, payment_terms: e.target.value })}
                    placeholder="30 días fecha factura"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label>Condiciones de entrega</Label>
                  <Input
                    value={editing.delivery_terms || ""}
                    onChange={(e) => setEditing({ ...editing, delivery_terms: e.target.value })}
                  />
                </div>
                <div className="md:col-span-3">
                  <Label>Notas</Label>
                  <Textarea
                    value={editing.notes || ""}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Ítems / Catálogo de precios</h4>
                  <Button size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" /> Añadir ítem
                  </Button>
                </div>
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin ítems. Añade productos con precios pactados.</p>
                )}
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                      <div className="col-span-4">
                        <Label className="text-xs">Descripción</Label>
                        <Input value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">SKU</Label>
                        <Input value={it.sku || ""} onChange={(e) => updateItem(idx, { sku: e.target.value })} />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Unid</Label>
                        <Input value={it.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Precio unit.</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={it.unit_price}
                          onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Mín</Label>
                        <Input
                          type="number"
                          value={it.min_quantity ?? ""}
                          onChange={(e) =>
                            updateItem(idx, { min_quantity: e.target.value ? Number(e.target.value) : null })
                          }
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Máx</Label>
                        <Input
                          type="number"
                          value={it.max_quantity ?? ""}
                          onChange={(e) =>
                            updateItem(idx, { max_quantity: e.target.value ? Number(e.target.value) : null })
                          }
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {it.consumed_quantity !== undefined && it.consumed_quantity > 0 && (
                        <div className="col-span-12 text-xs text-muted-foreground">
                          Consumido: {it.consumed_quantity} {it.unit}
                          {it.max_quantity ? ` / ${it.max_quantity}` : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
