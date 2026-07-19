import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Gavel, Trophy, Loader2 } from "lucide-react";

interface Props {
  rfqId: string;
  currency: string;
  onChanged?: () => void;
}

interface AuctionCfg {
  auction_enabled: boolean;
  auction_start_at: string | null;
  auction_end_at: string | null;
  auction_min_decrement: number;
  auction_starting_price: number | null;
  auction_closed_at: string | null;
}

const toInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

const AuctionAdmin = ({ rfqId, currency, onChanged }: Props) => {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<AuctionCfg | null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: rfq }, { data: b }] = await Promise.all([
      (supabase as any).from("rfqs")
        .select("auction_enabled,auction_start_at,auction_end_at,auction_min_decrement,auction_starting_price,auction_closed_at")
        .eq("id", rfqId).single(),
      (supabase as any).from("rfq_auction_bids")
        .select("id, amount, delivery_days, notes, created_at, supplier_id, suppliers(name)")
        .eq("rfq_id", rfqId).order("amount"),
    ]);
    if (rfq) setCfg(rfq as AuctionCfg);
    setBids(b || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`admin-auction-${rfqId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rfq_auction_bids", filter: `rfq_id=eq.${rfqId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId]);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    const { error } = await (supabase as any).from("rfqs").update({
      auction_enabled: cfg.auction_enabled,
      auction_start_at: cfg.auction_start_at,
      auction_end_at: cfg.auction_end_at,
      auction_min_decrement: cfg.auction_min_decrement,
      auction_starting_price: cfg.auction_starting_price,
    }).eq("id", rfqId);
    setSaving(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Configuración guardada" });
    onChanged?.();
    load();
  };

  const closeNow = async () => {
    if (!confirm("¿Cerrar la subasta ahora?")) return;
    await (supabase as any).from("rfqs").update({ auction_closed_at: new Date().toISOString() }).eq("id", rfqId);
    toast({ title: "Subasta cerrada" });
    load();
  };

  if (!cfg) return <div className="py-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;

  const bestByBidder = bids.reduce((m: Record<string, any>, b) => {
    if (!m[b.supplier_id] || Number(b.amount) < Number(m[b.supplier_id].amount)) m[b.supplier_id] = b;
    return m;
  }, {});
  const ranked = Object.values(bestByBidder).sort((a: any, b: any) => Number(a.amount) - Number(b.amount));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gavel className="h-4 w-4" /> Subasta inversa
          {cfg.auction_closed_at && <Badge variant="outline">Cerrada</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Habilitar subasta inversa</Label>
            <p className="text-xs text-muted-foreground">Los proveedores invitados compiten en tiempo real.</p>
          </div>
          <Switch checked={cfg.auction_enabled} onCheckedChange={(v) => setCfg({ ...cfg, auction_enabled: v })} />
        </div>

        {cfg.auction_enabled && (
          <>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Inicio</Label>
                <Input type="datetime-local" value={toInput(cfg.auction_start_at)}
                  onChange={(e) => setCfg({ ...cfg, auction_start_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              </div>
              <div>
                <Label className="text-xs">Cierre</Label>
                <Input type="datetime-local" value={toInput(cfg.auction_end_at)}
                  onChange={(e) => setCfg({ ...cfg, auction_end_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              </div>
              <div>
                <Label className="text-xs">Precio de partida ({currency})</Label>
                <Input type="number" step="0.01" value={cfg.auction_starting_price ?? ""}
                  onChange={(e) => setCfg({ ...cfg, auction_starting_price: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label className="text-xs">Decremento mínimo ({currency})</Label>
                <Input type="number" step="0.01" value={cfg.auction_min_decrement}
                  onChange={(e) => setCfg({ ...cfg, auction_min_decrement: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              {!cfg.auction_closed_at && cfg.auction_end_at && (
                <Button size="sm" variant="outline" onClick={closeNow}>Cerrar ahora</Button>
              )}
              <Button size="sm" onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Guardar
              </Button>
            </div>

            <div className="border-t pt-3">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Ranking en vivo ({ranked.length})
              </div>
              {ranked.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin pujas todavía.</p>
              ) : (
                <div className="space-y-1">
                  {ranked.map((b: any, idx: number) => (
                    <div key={b.id} className={`flex items-center justify-between text-sm border rounded px-2 py-1 ${idx === 0 ? "bg-emerald-500/10" : ""}`}>
                      <div>
                        <span className="font-mono text-xs mr-2">#{idx + 1}</span>
                        <span className="font-medium">{b.suppliers?.name || "—"}</span>
                        {b.delivery_days && <span className="text-xs text-muted-foreground ml-2">{b.delivery_days} d</span>}
                      </div>
                      <div className="font-bold">{currency} {Number(b.amount).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">Total de pujas registradas: {bids.length}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AuctionAdmin;
