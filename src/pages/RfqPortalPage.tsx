import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ClipboardList } from "lucide-react";
import SEO from "@/components/SEO";
import AuctionPanel from "@/components/auction/AuctionPanel";

interface RfqItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  specifications: string | null;
  sort_order: number;
}
interface Rfq {
  invitation_id: string;
  rfq_id: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  currency: string;
  deadline: string | null;
  status: string;
  supplier_id: string;
  supplier_name: string;
  items: RfqItem[];
}

const RfqPortalPage = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [prices, setPrices] = useState<Record<string, { unit_price: number; notes: string }>>({});
  const [deliveryDays, setDeliveryDays] = useState<number | "">("");
  const [paymentTerms, setPaymentTerms] = useState("Contado");
  const [validityDays, setValidityDays] = useState<number | "">(30);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("get_rfq_by_token", { _token: token });
      if (error || !data?.length) {
        toast({ title: "Enlace inválido", description: "La solicitud no está disponible.", variant: "destructive" });
      } else {
        setRfq(data[0] as Rfq);
      }
      setLoading(false);
    })();
  }, [token, toast]);

  const total = useMemo(() => {
    if (!rfq) return 0;
    return rfq.items.reduce((sum, it) => {
      const p = prices[it.id]?.unit_price || 0;
      return sum + Number(p) * Number(it.quantity);
    }, 0);
  }, [prices, rfq]);

  const handleSubmit = async () => {
    if (!rfq) return;
    const items = rfq.items.map((it) => ({
      rfq_item_id: it.id,
      unit_price: Number(prices[it.id]?.unit_price || 0),
      subtotal: Number(prices[it.id]?.unit_price || 0) * Number(it.quantity),
      notes: prices[it.id]?.notes || null,
    }));
    if (items.some((i) => i.unit_price <= 0)) {
      toast({ title: "Faltan precios", description: "Ingresa un precio unitario para cada ítem.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("submit_rfq_response", {
      _token: token,
      _total: total,
      _currency: rfq.currency,
      _delivery_days: deliveryDays ? Number(deliveryDays) : null,
      _payment_terms: paymentTerms,
      _validity_days: validityDays ? Number(validityDays) : 30,
      _notes: notes || null,
      _items: items,
      _ip: null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Cotización enviada", description: "Gracias por tu propuesta." });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!rfq) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Enlace no válido</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">La solicitud puede haber expirado o ya fue cerrada.</p></CardContent>
        </Card>
      </div>
    );
  }
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-10 space-y-4">
            <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-500" />
            <h2 className="text-2xl font-heading font-bold">¡Cotización recibida!</h2>
            <p className="text-sm text-muted-foreground">Revisaremos tu propuesta y te contactaremos.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <SEO title={`RFQ ${rfq.code} — Cotización de proveedor`} description="Portal de cotización" path={`/rfq/${token}`} />
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-2"><ClipboardList className="h-3.5 w-3.5" /> {rfq.code}</div>
                <CardTitle className="text-2xl">{rfq.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Proveedor: <strong>{rfq.supplier_name}</strong></p>
              </div>
              {rfq.deadline && (
                <div className="text-right text-xs">
                  <div className="text-muted-foreground">Fecha límite</div>
                  <div className="font-semibold">{new Date(rfq.deadline).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </CardHeader>
          {rfq.description && (
            <CardContent>
              <p className="text-sm whitespace-pre-line">{rfq.description}</p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Ítems solicitados</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {rfq.items.map((it) => (
              <div key={it.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="font-medium">{it.description}</div>
                    <div className="text-xs text-muted-foreground">Cantidad: {it.quantity} {it.unit}</div>
                    {it.specifications && <div className="text-xs mt-1 text-muted-foreground">{it.specifications}</div>}
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Precio unitario ({rfq.currency})</Label>
                    <Input
                      type="number" step="0.01" min="0"
                      value={prices[it.id]?.unit_price ?? ""}
                      onChange={(e) => setPrices((p) => ({ ...p, [it.id]: { ...p[it.id], unit_price: Number(e.target.value), notes: p[it.id]?.notes || "" } }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Notas del ítem (opcional)</Label>
                    <Input
                      value={prices[it.id]?.notes ?? ""}
                      onChange={(e) => setPrices((p) => ({ ...p, [it.id]: { ...p[it.id], notes: e.target.value, unit_price: p[it.id]?.unit_price || 0 } }))}
                    />
                  </div>
                </div>
                <div className="text-right text-sm">
                  Subtotal: <strong>{rfq.currency} {((prices[it.id]?.unit_price || 0) * Number(it.quantity)).toFixed(2)}</strong>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Condiciones</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Plazo de entrega (días)</Label>
                <Input type="number" min="0" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value ? Number(e.target.value) : "")} />
              </div>
              <div>
                <Label className="text-xs">Condiciones de pago</Label>
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Validez (días)</Label>
                <Input type="number" min="1" value={validityDays} onChange={(e) => setValidityDays(e.target.value ? Number(e.target.value) : "")} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notas adicionales</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <div className="text-lg">Total: <strong>{rfq.currency} {total.toFixed(2)}</strong></div>
              <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Enviar cotización
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RfqPortalPage;
