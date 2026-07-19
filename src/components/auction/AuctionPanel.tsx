import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Gavel, Loader2, Timer, Trophy, Users } from "lucide-react";

interface AuctionState {
  rfq_id: string;
  code: string;
  title: string;
  currency: string;
  auction_enabled: boolean;
  auction_start_at: string | null;
  auction_end_at: string | null;
  auction_closed_at: string | null;
  auction_min_decrement: number;
  auction_starting_price: number | null;
  my_best: number | null;
  best_overall: number | null;
  my_rank: number | null;
  total_bidders: number;
}

interface AuctionPanelProps {
  token: string;
}

/**
 * Live reverse-auction UI used by the supplier RFQ portal.
 * Polls `get_auction_state` and subscribes to `rfq_auction_bids` realtime.
 */
const AuctionPanel = ({ token }: AuctionPanelProps) => {
  const { toast } = useToast();
  const [state, setState] = useState<AuctionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState<number | "">("");
  const [days, setDays] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = async () => {
    const { data } = await (supabase as any).rpc("get_auction_state", { _token: token });
    if (data?.length) setState(data[0] as AuctionState);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [token]);

  useEffect(() => {
    if (!state?.rfq_id) return;
    const ch = supabase
      .channel(`auction-${state.rfq_id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rfq_auction_bids", filter: `rfq_id=eq.${state.rfq_id}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [state?.rfq_id]);

  const status = useMemo(() => {
    if (!state) return "loading";
    if (state.auction_closed_at) return "closed";
    if (state.auction_end_at && new Date(state.auction_end_at).getTime() < now) return "ended";
    if (state.auction_start_at && new Date(state.auction_start_at).getTime() > now) return "upcoming";
    return "live";
  }, [state, now]);

  const timeLeft = useMemo(() => {
    if (!state?.auction_end_at) return null;
    const diff = new Date(state.auction_end_at).getTime() - now;
    if (diff <= 0) return "00:00";
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [state?.auction_end_at, now]);

  const placeBid = async () => {
    if (!bid || Number(bid) <= 0) {
      toast({ title: "Ingresa un monto válido", variant: "destructive" });
      return;
    }
    setPlacing(true);
    const { error } = await (supabase as any).rpc("place_auction_bid", {
      _token: token,
      _amount: Number(bid),
      _delivery_days: days ? Number(days) : null,
      _notes: notes || null,
      _ip: null,
    });
    setPlacing(false);
    if (error) {
      const map: Record<string, string> = {
        auction_disabled: "La subasta no está activa.",
        auction_not_started: "La subasta aún no ha comenzado.",
        auction_ended: "La subasta ya terminó.",
        auction_closed: "La subasta fue cerrada.",
        bid_above_starting_price: "Tu oferta supera el precio de partida.",
        bid_must_improve_by_min_decrement: `Debes mejorar la mejor oferta por al menos ${state?.auction_min_decrement}.`,
      };
      toast({ title: "No se pudo pujar", description: map[error.message] || error.message, variant: "destructive" });
      return;
    }
    toast({ title: "¡Puja registrada!" });
    setBid("");
    setNotes("");
    load();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  if (!state || !state.auction_enabled) return null;

  const isLive = status === "live";
  const suggested = state.best_overall
    ? Number(state.best_overall) - Number(state.auction_min_decrement)
    : state.auction_starting_price ?? "";

  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" /> Subasta inversa en vivo
          </CardTitle>
          <Badge
            className={
              status === "live" ? "bg-emerald-500/20 text-emerald-700" :
              status === "upcoming" ? "bg-blue-500/20 text-blue-700" :
              "bg-muted"
            }
          >
            {status === "live" ? "En vivo" : status === "upcoming" ? "Próxima" : "Cerrada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="border rounded-lg p-3">
            <Timer className="h-4 w-4 mx-auto text-muted-foreground" />
            <div className="text-xs text-muted-foreground mt-1">Tiempo</div>
            <div className="text-lg font-bold tabular-nums">{timeLeft ?? "—"}</div>
          </div>
          <div className="border rounded-lg p-3">
            <Trophy className="h-4 w-4 mx-auto text-amber-500" />
            <div className="text-xs text-muted-foreground mt-1">Mejor oferta</div>
            <div className="text-lg font-bold">{state.best_overall ? `${state.currency} ${Number(state.best_overall).toFixed(2)}` : "—"}</div>
          </div>
          <div className="border rounded-lg p-3">
            <Gavel className="h-4 w-4 mx-auto text-primary" />
            <div className="text-xs text-muted-foreground mt-1">Tu mejor</div>
            <div className="text-lg font-bold">{state.my_best ? `${state.currency} ${Number(state.my_best).toFixed(2)}` : "—"}</div>
          </div>
          <div className="border rounded-lg p-3">
            <Users className="h-4 w-4 mx-auto text-muted-foreground" />
            <div className="text-xs text-muted-foreground mt-1">Ranking</div>
            <div className="text-lg font-bold">{state.my_rank ? `#${state.my_rank}/${state.total_bidders}` : "—"}</div>
          </div>
        </div>

        {isLive ? (
          <div className="border-t pt-3 space-y-2">
            <div className="grid sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <Label className="text-xs">Tu puja ({state.currency})</Label>
                <Input
                  type="number" step="0.01" min="0"
                  placeholder={suggested ? String(suggested) : ""}
                  value={bid}
                  onChange={(e) => setBid(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <Label className="text-xs">Plazo entrega (días)</Label>
                <Input type="number" min="0" value={days} onChange={(e) => setDays(e.target.value ? Number(e.target.value) : "")} />
              </div>
              <div>
                <Label className="text-xs">Nota (opcional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <Button className="w-full" onClick={placeBid} disabled={placing}>
              {placing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Pujar
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Debes mejorar la mejor oferta por al menos {state.currency} {Number(state.auction_min_decrement).toFixed(2)}. Las pujas en los últimos 2 min extienden el cierre.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground border-t pt-3">
            {status === "upcoming" && state.auction_start_at ? `Comienza el ${new Date(state.auction_start_at).toLocaleString()}.` : "La subasta ya terminó."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AuctionPanel;
