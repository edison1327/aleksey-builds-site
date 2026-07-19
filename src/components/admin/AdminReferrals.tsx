import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Gift, Search, Trophy, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Status = "pending" | "registered" | "converted" | "rewarded";

interface Referral {
  id: string;
  referrer_user_id: string;
  code_used: string;
  referred_email: string | null;
  source: string | null;
  status: Status;
  reward_note: string | null;
  contact_message_id: string | null;
  created_at: string;
  converted_at: string | null;
}

const statusLabels: Record<Status, string> = {
  pending: "Pendiente",
  registered: "Registrado",
  converted: "Convertido",
  rewarded: "Recompensado",
};

const statusColors: Record<Status, string> = {
  pending: "bg-slate-500/10 text-slate-500 border-slate-500/30",
  registered: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  converted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  rewarded: "bg-primary/10 text-primary border-primary/30",
};

export default function AdminReferrals() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editing, setEditing] = useState<Referral | null>(null);
  const [editStatus, setEditStatus] = useState<Status>("pending");
  const [editNote, setEditNote] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setRows((data as Referral[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !r.code_used.toLowerCase().includes(s) &&
          !(r.referred_email ?? "").toLowerCase().includes(s) &&
          !r.referrer_user_id.includes(s)
        )
          return false;
      }
      return true;
    });
  }, [rows, search, filterStatus]);

  const leaderboard = useMemo(() => {
    const map = new Map<string, { code: string; total: number; converted: number }>();
    rows.forEach((r) => {
      const entry = map.get(r.referrer_user_id) ?? { code: r.code_used, total: 0, converted: 0 };
      entry.total += 1;
      if (r.status === "converted" || r.status === "rewarded") entry.converted += 1;
      map.set(r.referrer_user_id, entry);
    });
    return Array.from(map.entries())
      .map(([user_id, s]) => ({ user_id, ...s }))
      .sort((a, b) => b.converted - a.converted || b.total - a.total)
      .slice(0, 5);
  }, [rows]);

  const openEdit = (r: Referral) => {
    setEditing(r);
    setEditStatus(r.status);
    setEditNote(r.reward_note ?? "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const patch: Partial<Referral> = { status: editStatus, reward_note: editNote || null };
    if (
      (editStatus === "converted" || editStatus === "rewarded") &&
      !editing.converted_at
    ) {
      patch.converted_at = new Date().toISOString();
    }
    const { error } = await supabase.from("referrals").update(patch).eq("id", editing.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Referido actualizado" });
    setEditing(null);
    load();
  };

  const remove = async (r: Referral) => {
    if (!confirm("¿Eliminar este referido?")) return;
    const { error } = await supabase.from("referrals").delete().eq("id", r.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const stats = {
    total: rows.length,
    converted: rows.filter((r) => r.status === "converted" || r.status === "rewarded").length,
    rewarded: rows.filter((r) => r.status === "rewarded").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referidos</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona el programa de referidos y otorga recompensas.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-emerald-600">{stats.converted}</p><p className="text-xs text-muted-foreground">Convertidos</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-primary">{stats.rewarded}</p><p className="text-xs text-muted-foreground">Recompensados</p></CardContent></Card>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Top referidores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {leaderboard.map((l, i) => (
              <div key={l.user_id} className="flex items-center justify-between py-1.5 text-sm border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary w-5">#{i + 1}</span>
                  <span className="font-mono">{l.code}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{l.converted} conv.</span>
                  <span>{l.total} total</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar código, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            Sin referidos.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-primary">{r.code_used}</span>
                    <Badge variant="outline" className={statusColors[r.status]}>
                      {statusLabels[r.status]}
                    </Badge>
                    {r.reward_note && (
                      <Badge variant="outline" className="gap-1">
                        <Gift className="h-3 w-3" /> {r.reward_note}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm mt-1 truncate">
                    {r.referred_email ?? "—"} <span className="text-muted-foreground">· {r.source ?? "web"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "PPp", { locale: es })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                    Gestionar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar referido</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Estado</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nota de recompensa</label>
              <Textarea
                rows={3}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Ej: 10% descuento aplicado en cotización #123"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
