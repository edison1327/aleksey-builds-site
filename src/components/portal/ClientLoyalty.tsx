import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Award, Gift, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Balance { earned: number; spent: number; available: number; tier: string; }
interface Reward { id: string; title: string; description: string | null; points_required: number; stock: number | null; }

const tierColor: Record<string,string> = {
  Bronce: "bg-amber-700",
  Plata: "bg-slate-400",
  Oro: "bg-yellow-500",
  Platino: "bg-cyan-500",
};

interface Props { email: string; name?: string | null; }

const ClientLoyalty = ({ email, name }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Reward | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [b, r] = await Promise.all([
      (supabase as any).rpc("get_loyalty_balance", { _email: email }),
      (supabase as any).from("loyalty_rewards").select("*").eq("is_active", true).order("points_required"),
    ]);
    setBalance(b.data?.[0] ?? { earned: 0, spent: 0, available: 0, tier: "Bronce" });
    setRewards(r.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [email]);

  const redeem = async () => {
    if (!selected) return;
    if ((balance?.available ?? 0) < selected.points_required) {
      toast({ title: "Puntos insuficientes", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("loyalty_redemptions").insert({
      customer_email: email,
      customer_name: name ?? null,
      reward_id: selected.id,
      points_spent: selected.points_required,
      notes: notes || null,
    });
    setSubmitting(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Solicitud enviada", description: "Te avisaremos cuando esté lista." });
    setSelected(null);
    setNotes("");
    load();
  };

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-wrap items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-bold">{balance?.available ?? 0} <span className="text-sm font-normal text-muted-foreground">puntos disponibles</span></div>
              <div className="text-xs text-muted-foreground">Acumulados: {balance?.earned ?? 0} · Canjeados: {balance?.spent ?? 0}</div>
            </div>
          </div>
          <Badge className={tierColor[balance?.tier || "Bronce"]}>Nivel {balance?.tier}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Gift className="h-5 w-5" />Recompensas disponibles</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rewards.map(r => {
            const affordable = (balance?.available ?? 0) >= r.points_required;
            return (
              <Card key={r.id} className={!affordable ? "opacity-60" : ""}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold">{r.title}</div>
                    <Badge>{r.points_required} pts</Badge>
                  </div>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  <Button size="sm" className="w-full mt-2" disabled={!affordable} onClick={() => setSelected(r)}>
                    <Sparkles className="h-4 w-4 mr-1" />Canjear
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {rewards.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Aún no hay recompensas disponibles.</p>}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Canjear: {selected?.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Costo: <b>{selected?.points_required} pts</b> · Quedarán {(balance?.available ?? 0) - (selected?.points_required ?? 0)} pts.</p>
          <div>
            <label className="text-sm font-medium">Notas (opcional)</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dirección de entrega, preferencias, etc." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button onClick={redeem} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Confirmar canje</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientLoyalty;
