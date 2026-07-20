import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Award, Gift, Loader2, Plus, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_required: number;
  stock: number | null;
  is_active: boolean;
}
interface Redemption {
  id: string;
  customer_email: string;
  customer_name: string | null;
  reward_id: string;
  points_spent: number;
  status: string;
  notes: string | null;
  created_at: string;
}
interface PointEntry {
  id: string;
  customer_email: string;
  points: number;
  reason: string;
  created_at: string;
}

const AdminLoyalty = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [entries, setEntries] = useState<PointEntry[]>([]);

  const [rewardForm, setRewardForm] = useState({ title: "", description: "", points_required: 500, stock: "" });
  const [adjForm, setAdjForm] = useState({ email: "", points: 100, reason: "" });

  const load = async () => {
    setLoading(true);
    const [r, red, ent] = await Promise.all([
      (supabase as any).from("loyalty_rewards").select("*").order("points_required"),
      (supabase as any).from("loyalty_redemptions").select("*").order("created_at", { ascending: false }).limit(100),
      (supabase as any).from("loyalty_points").select("id, customer_email, points, reason, created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    setRewards(r.data ?? []);
    setRedemptions(red.data ?? []);
    setEntries(ent.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createReward = async () => {
    if (!rewardForm.title || !rewardForm.points_required) return;
    const { error } = await (supabase as any).from("loyalty_rewards").insert({
      title: rewardForm.title,
      description: rewardForm.description || null,
      points_required: rewardForm.points_required,
      stock: rewardForm.stock ? Number(rewardForm.stock) : null,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Recompensa creada" });
    setRewardForm({ title: "", description: "", points_required: 500, stock: "" });
    load();
  };
  const toggleReward = async (r: Reward) => {
    await (supabase as any).from("loyalty_rewards").update({ is_active: !r.is_active }).eq("id", r.id);
    load();
  };
  const deleteReward = async (id: string) => {
    if (!confirm("¿Eliminar recompensa?")) return;
    await (supabase as any).from("loyalty_rewards").delete().eq("id", id);
    load();
  };

  const adjustPoints = async () => {
    if (!adjForm.email || !adjForm.points || !adjForm.reason) return;
    const { error } = await (supabase as any).from("loyalty_points").insert({
      customer_email: adjForm.email.trim().toLowerCase(),
      points: adjForm.points,
      reason: adjForm.reason,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Puntos ajustados" });
    setAdjForm({ email: "", points: 100, reason: "" });
    load();
  };

  const updateRedemption = async (id: string, status: string) => {
    await (supabase as any).from("loyalty_redemptions").update({ status }).eq("id", id);
    load();
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Award className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Fidelización & Recompensas</h1>
      </div>

      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards"><Gift className="h-4 w-4 mr-1" />Catálogo</TabsTrigger>
          <TabsTrigger value="redemptions">Canjes ({redemptions.filter(r => r.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="ledger">Historial de puntos</TabsTrigger>
          <TabsTrigger value="adjust"><Sparkles className="h-4 w-4 mr-1" />Ajustar</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Nueva recompensa</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-3">
              <div><Label>Título</Label><Input value={rewardForm.title} onChange={e => setRewardForm({ ...rewardForm, title: e.target.value })} /></div>
              <div><Label>Puntos requeridos</Label><Input type="number" value={rewardForm.points_required} onChange={e => setRewardForm({ ...rewardForm, points_required: Number(e.target.value) })} /></div>
              <div><Label>Stock (opcional)</Label><Input type="number" value={rewardForm.stock} onChange={e => setRewardForm({ ...rewardForm, stock: e.target.value })} /></div>
              <div className="md:col-span-4"><Label>Descripción</Label><Textarea value={rewardForm.description} onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })} /></div>
              <div className="md:col-span-4"><Button onClick={createReward}><Plus className="h-4 w-4 mr-1" />Crear</Button></div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rewards.map(r => (
              <Card key={r.id} className={!r.is_active ? "opacity-60" : ""}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between gap-2">
                    <div className="font-semibold">{r.title}</div>
                    <Badge>{r.points_required} pts</Badge>
                  </div>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  {r.stock !== null && <div className="text-xs">Stock: {r.stock}</div>}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => toggleReward(r)}>{r.is_active ? "Desactivar" : "Activar"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteReward(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {rewards.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Aún no hay recompensas.</p>}
          </div>
        </TabsContent>

        <TabsContent value="redemptions" className="space-y-2">
          {redemptions.map(rd => {
            const rw = rewards.find(x => x.id === rd.reward_id);
            return (
              <Card key={rd.id}>
                <CardContent className="pt-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{rw?.title || "Recompensa"} <Badge variant="outline">{rd.points_spent} pts</Badge></div>
                    <div className="text-sm text-muted-foreground">{rd.customer_email}{rd.customer_name && ` — ${rd.customer_name}`}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(rd.created_at), "PPp")}</div>
                    {rd.notes && <p className="text-sm mt-1 italic">"{rd.notes}"</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{rd.status}</Badge>
                    {rd.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateRedemption(rd.id, "approved")}>Aprobar</Button>
                        <Button size="sm" variant="outline" onClick={() => updateRedemption(rd.id, "rejected")}>Rechazar</Button>
                      </>
                    )}
                    {rd.status === "approved" && (
                      <Button size="sm" onClick={() => updateRedemption(rd.id, "delivered")}>Marcar entregado</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {redemptions.length === 0 && <p className="text-sm text-muted-foreground">Sin canjes.</p>}
        </TabsContent>

        <TabsContent value="ledger" className="space-y-1">
          {entries.map(e => (
            <div key={e.id} className="flex items-center justify-between border-b border-border/50 py-2 text-sm">
              <div>
                <div className="font-medium">{e.customer_email}</div>
                <div className="text-xs text-muted-foreground">{e.reason} · {format(new Date(e.created_at), "PPp")}</div>
              </div>
              <Badge variant={e.points >= 0 ? "default" : "destructive"}>{e.points > 0 ? "+" : ""}{e.points}</Badge>
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-muted-foreground">Sin movimientos.</p>}
        </TabsContent>

        <TabsContent value="adjust">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ajuste manual de puntos</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-3">
              <div className="md:col-span-2"><Label>Email cliente</Label><Input type="email" value={adjForm.email} onChange={e => setAdjForm({ ...adjForm, email: e.target.value })} /></div>
              <div><Label>Puntos (+/-)</Label><Input type="number" value={adjForm.points} onChange={e => setAdjForm({ ...adjForm, points: Number(e.target.value) })} /></div>
              <div className="md:col-span-4"><Label>Motivo</Label><Input value={adjForm.reason} onChange={e => setAdjForm({ ...adjForm, reason: e.target.value })} /></div>
              <div className="md:col-span-4"><Button onClick={adjustPoints}><Sparkles className="h-4 w-4 mr-1" />Aplicar</Button></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLoyalty;
