import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ensureReferralCode, referralLink } from "@/lib/referral";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Copy, Share2, Users, Gift, Sparkles, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Referral {
  id: string;
  referred_email: string | null;
  source: string | null;
  status: "pending" | "registered" | "converted" | "rewarded";
  reward_note: string | null;
  created_at: string;
  converted_at: string | null;
}

const statusMeta: Record<Referral["status"], { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-slate-500/10 text-slate-500 border-slate-500/30" },
  registered: { label: "Registrado", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  converted: { label: "Convertido", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  rewarded: { label: "Recompensado", className: "bg-primary/10 text-primary border-primary/30" },
};

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/portal/login?redirect=/referidos");
      return;
    }
    (async () => {
      const c = await ensureReferralCode(user.id);
      setCode(c);
      const { data } = await supabase
        .from("referrals")
        .select("id, referred_email, source, status, reward_note, created_at, converted_at")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });
      setReferrals((data as Referral[]) ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const link = code ? referralLink(code) : "";

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado` });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  const share = async () => {
    if (!link) return;
    const payload = {
      title: "ALEKSEY — Alquiler de maquinaria y vehículos",
      text: `Te recomiendo ALEKSEY. Usa mi código ${code} al pedir tu cotización.`,
      url: link,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch {
        /* cancelled */
      }
    } else {
      copy(link, "Link");
    }
  };

  const counts = {
    total: referrals.length,
    converted: referrals.filter((r) => r.status === "converted" || r.status === "rewarded").length,
    pending: referrals.filter((r) => r.status === "pending" || r.status === "registered").length,
    rewarded: referrals.filter((r) => r.status === "rewarded").length,
  };

  return (
    <>
      <SEO title="Programa de Referidos — ALEKSEY" description="Comparte ALEKSEY con tu red y obtén beneficios exclusivos." />
      <div className="pt-24 pb-16 min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-5xl space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/mis-solicitudes"><ArrowLeft className="h-4 w-4 mr-1" /> Portal</Link>
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Programa de referidos</h1>
              <p className="text-sm text-muted-foreground">
                Comparte tu código y gana beneficios cuando tu contacto contrate con ALEKSEY.
              </p>
            </div>
          </div>

          {/* Code + link */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Tu código personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading || !code ? (
                <p className="text-sm text-muted-foreground">Generando código…</p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl md:text-4xl font-mono font-bold tracking-widest text-primary bg-primary/5 px-4 py-3 rounded-lg border border-primary/20">
                      {code}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copy(code, "Código")}>
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Link para compartir</label>
                    <div className="flex gap-2 mt-1">
                      <Input readOnly value={link} className="font-mono text-xs" />
                      <Button variant="outline" onClick={() => copy(link, "Link")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button onClick={share}>
                        <Share2 className="h-4 w-4 mr-1" /> Compartir
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{counts.total}</p><p className="text-xs text-muted-foreground">Total referidos</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-blue-600">{counts.pending}</p><p className="text-xs text-muted-foreground">En proceso</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-emerald-600">{counts.converted}</p><p className="text-xs text-muted-foreground">Convertidos</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-primary">{counts.rewarded}</p><p className="text-xs text-muted-foreground">Recompensados</p></CardContent></Card>
          </div>

          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Aún no tienes referidos. Comparte tu código para empezar.
                </p>
              ) : (
                <div className="space-y-2">
                  {referrals.map((r) => {
                    const meta = statusMeta[r.status];
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {r.referred_email ?? "Contacto anónimo"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.source ?? "web"} · {format(new Date(r.created_at), "PPp", { locale: es })}
                          </p>
                          {r.reward_note && (
                            <p className="text-xs text-primary mt-0.5">🎁 {r.reward_note}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Cómo funciona:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Comparte tu link o código con clientes potenciales.</li>
                <li>Cuando soliciten una cotización, se registra automáticamente aquí.</li>
                <li>Al concretar el servicio, marcamos el referido como convertido.</li>
                <li>Recibes un beneficio (descuento o crédito) según el monto contratado.</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
