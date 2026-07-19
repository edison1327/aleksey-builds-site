import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Check, X, Star, Loader2, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PendingReview {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  verified: boolean;
  booking_id: string | null;
  submitted_by_email: string | null;
  created_at: string;
}

const ModerateReviews = () => {
  const [items, setItems] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("testimonials")
      .select("id, name, role, company, content, rating, verified, booking_id, submitted_by_email, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setItems((data as PendingReview[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    const { error } = await supabase.from("testimonials").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Reseña publicada" : "Reseña rechazada");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) {
    return <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>;
  }

  if (items.length === 0) return null;

  return (
    <Card className="border-primary/40 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-primary" />
          Reseñas pendientes de moderación
          <Badge className="bg-primary text-primary-foreground ml-1">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="p-4 rounded-lg border border-border bg-background space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{r.name}</span>
                <span className="text-xs text-muted-foreground">· {r.role} en {r.company}</span>
                {r.booking_id && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Vinculada a reserva
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              {r.submitted_by_email && <span>{r.submitted_by_email}</span>}
            </div>
            <p className="text-sm text-foreground/90 italic">"{r.content}"</p>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === r.id}
                onClick={() => decide(r.id, "rejected")}
                className="text-destructive border-destructive/40 hover:bg-destructive/5"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Rechazar
              </Button>
              <Button
                size="sm"
                disabled={busyId === r.id}
                onClick={() => decide(r.id, "approved")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Aprobar y publicar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ModerateReviews;
