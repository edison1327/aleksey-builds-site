import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Star, ShieldCheck, Clock, Check, X, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Booking {
  id: string;
  equipment_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Review {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  status: string;
  verified: boolean;
  booking_id: string | null;
  created_at: string;
}

const statusBadge = (s: string) => {
  if (s === "approved") return <Badge className="bg-emerald-600"><Check className="h-3 w-3 mr-1" />Publicada</Badge>;
  if (s === "rejected") return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rechazada</Badge>;
  return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
};

const LeaveReviewForm = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [bookingId, setBookingId] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: b }, { data: r }] = await Promise.all([
        supabase
          .from("equipment_bookings")
          .select("id, equipment_type, start_date, end_date, status")
          .eq("created_by", user.id)
          .in("status", ["completed", "approved", "confirmed"])
          .order("end_date", { ascending: false }),
        supabase
          .from("testimonials")
          .select("id, name, role, company, content, rating, status, verified, booking_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setBookings((b as Booking[]) || []);
      setReviews((r as Review[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const canReview = bookings.length > 0;

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim() || !company.trim() || !content.trim()) {
      toast.error("Completa nombre, empresa y reseña");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        user_id: user.id,
        booking_id: bookingId || null,
        submitted_by_email: user.email,
        name: name.trim(),
        role: role.trim() || "Cliente",
        company: company.trim(),
        content: content.trim(),
        rating,
        status: "pending",
        is_active: false,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("¡Gracias! Tu reseña será revisada.");
    setReviews((prev) => [data as Review, ...prev]);
    setName(""); setRole(""); setCompany(""); setContent(""); setRating(5); setBookingId("");
  };

  if (loading) {
    return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {reviews.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4 text-primary" />
              Mis reseñas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border border-border/50 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {statusBadge(r.status)}
                    {r.verified && (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Verificada
                      </Badge>
                    )}
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "PP", { locale: es })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">"{r.content}"</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dejar una reseña</CardTitle>
          <CardDescription>
            {canReview
              ? "Comparte tu experiencia. Se publicará tras la revisión del equipo."
              : "Necesitas al menos una reserva completada para poder dejar una reseña verificada."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!canReview ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Cuando tu próxima reserva finalice, podrás dejar tu opinión aquí.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre público</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" />
                </div>
                <div className="space-y-1.5">
                  <Label>Cargo</Label>
                  <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ej: Jefe de Obra" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nombre de la empresa" />
              </div>
              <div className="space-y-1.5">
                <Label>Reserva relacionada</Label>
                <Select value={bookingId} onValueChange={setBookingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una reserva" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.equipment_type} · {format(new Date(b.start_date), "P", { locale: es })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Calificación</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
                      <Star className={`h-6 w-6 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tu reseña</Label>
                <Textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Cuéntanos sobre tu experiencia con Aleksey…"
                  maxLength={800}
                />
                <p className="text-xs text-muted-foreground text-right">{content.length}/800</p>
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enviar reseña
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveReviewForm;
