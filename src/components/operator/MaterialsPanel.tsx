import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { enqueue } from "@/lib/offlineQueue";

type Stock = { id: string; name: string; unit: string | null; current_qty: number };
type Reservation = {
  id: string;
  stock_item_id: string;
  quantity: number;
  status: string;
  notes: string | null;
  requested_by: string | null;
  stock_items?: { name: string; unit: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  reserved: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  consumed: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  released: "bg-muted text-muted-foreground",
};

export function MaterialsPanel({ workOrderId, userId }: { workOrderId: string; userId: string }) {
  const [stock, setStock] = useState<Stock[]>([]);
  const [items, setItems] = useState<Reservation[]>([]);
  const [open, setOpen] = useState(false);
  const [stockId, setStockId] = useState("");
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [s, r] = await Promise.all([
      supabase.from("stock_items" as any).select("id,name,unit,current_qty").order("name"),
      supabase.from("work_order_material_reservations" as any)
        .select("*, stock_items(name,unit)")
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: false }),
    ]);
    setStock((s.data as any) || []);
    setItems((r.data as any) || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workOrderId]);

  const create = async () => {
    if (!stockId || !qty) { toast.error("Selecciona material y cantidad"); return; }
    const q = Number(qty);
    if (!(q > 0)) { toast.error("Cantidad inválida"); return; }
    setBusy(true);
    const payload = {
      work_order_id: workOrderId,
      stock_item_id: stockId,
      quantity: q,
      requested_by: userId,
      notes: notes.trim() || null,
      status: "reserved",
    };
    try {
      if (!navigator.onLine) {
        enqueue({ table: "work_order_material_reservations", action: "insert", payload, label: `Reserva material` });
        toast.info("Sin conexión: reserva en cola");
      } else {
        const { error } = await supabase.from("work_order_material_reservations" as any).insert(payload);
        if (error) throw error;
        toast.success("Material reservado");
      }
      setOpen(false); setStockId(""); setQty("1"); setNotes("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally { setBusy(false); }
  };

  const changeStatus = async (r: Reservation, status: "consumed" | "released") => {
    const match = { id: r.id };
    const patch = { status };
    if (!navigator.onLine) {
      enqueue({ table: "work_order_material_reservations", action: "update", payload: patch, match, label: `Material ${status}` });
      toast.info("Sin conexión: cambio en cola");
    } else {
      const { error } = await supabase.from("work_order_material_reservations" as any).update(patch).eq("id", r.id);
      if (error) { toast.error(error.message); return; }
      toast.success(status === "consumed" ? "Consumido (stock actualizado)" : "Liberado");
    }
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
          <Package className="h-3 w-3" /> Materiales ({items.length})
        </p>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Reservar
        </Button>
      </div>

      {open && (
        <div className="rounded-md border border-border p-3 space-y-2 mb-3 bg-muted/30">
          <Select value={stockId} onValueChange={setStockId}>
            <SelectTrigger><SelectValue placeholder="Material del inventario" /></SelectTrigger>
            <SelectContent>
              {stock.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — stock: {s.current_qty}{s.unit ? ` ${s.unit}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" min={0.01} step={0.01} placeholder="Cantidad" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Textarea rows={2} placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={create} disabled={busy}>{busy ? "…" : "Reservar"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin materiales reservados</p>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="rounded-md border border-border p-2 text-sm flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{r.stock_items?.name || "—"}</span>
                  <Badge variant="outline">{r.quantity}{r.stock_items?.unit ? ` ${r.stock_items.unit}` : ""}</Badge>
                  <Badge variant="outline" className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                </div>
                {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
              </div>
              {r.status === "reserved" && r.requested_by === userId && (
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="secondary" onClick={() => changeStatus(r, "consumed")} title="Consumir (descuenta stock)">
                    <CheckCircle2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => changeStatus(r, "released")} title="Liberar">
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
