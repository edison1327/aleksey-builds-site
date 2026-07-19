import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, MessageCircle, Zap, Webhook, Calendar as CalIcon, FileSpreadsheet, ExternalLink } from "lucide-react";

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function download(name: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_WA_TEMPLATES = [
  { key: "cobro", label: "Recordatorio de cobro", body: "Hola {nombre}, te recordamos que la factura {codigo} por {monto} vence el {vencimiento}. Puedes pagarla aquí: {enlace}. ¡Gracias!" },
  { key: "reserva", label: "Confirmación de reserva", body: "Hola {nombre}, tu reserva del {fecha} está confirmada. Cualquier duda contáctanos por este medio." },
  { key: "ot", label: "OT en camino", body: "Hola {nombre}, tu OT {codigo} fue asignada y nuestro equipo se comunicará en breve." },
];

export default function AdminIntegrations() {
  const { toast } = useToast();
  const [zapUrl, setZapUrl] = useState(localStorage.getItem("zap_webhook_url") || "");
  const [waPhone, setWaPhone] = useState("");
  const [waTemplateKey, setWaTemplateKey] = useState(DEFAULT_WA_TEMPLATES[0].key);
  const [waBody, setWaBody] = useState(DEFAULT_WA_TEMPLATES[0].body);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = DEFAULT_WA_TEMPLATES.find((x) => x.key === waTemplateKey);
    if (t) setWaBody(t.body);
  }, [waTemplateKey]);

  const exportInvoices = async (format: "csv" | "json") => {
    setBusy(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("code,customer_name,customer_email,issue_date,due_date,subtotal,tax,total,amount_paid,status,currency")
      .order("issue_date", { ascending: false });
    setBusy(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    if (format === "csv") download(`facturas_${Date.now()}.csv`, toCsv(data || []));
    else download(`facturas_${Date.now()}.json`, JSON.stringify(data, null, 2), "application/json");
    toast({ title: "Exportado", description: `${data?.length || 0} facturas` });
  };

  const exportPOs = async (format: "csv" | "json") => {
    setBusy(true);
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("code,supplier_id,created_at,delivered_at,subtotal,tax,total,amount_paid,status,payment_status,currency")
      .order("created_at", { ascending: false });
    setBusy(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    if (format === "csv") download(`ordenes_compra_${Date.now()}.csv`, toCsv(data || []));
    else download(`ordenes_compra_${Date.now()}.json`, JSON.stringify(data, null, 2), "application/json");
    toast({ title: "Exportado", description: `${data?.length || 0} órdenes de compra` });
  };

  const sendWhatsApp = () => {
    const phone = waPhone.replace(/[^\d]/g, "");
    if (!phone) return toast({ title: "Falta teléfono", variant: "destructive" });
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(waBody)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const saveZap = () => {
    localStorage.setItem("zap_webhook_url", zapUrl);
    toast({ title: "Guardado", description: "URL de Zapier guardada localmente" });
  };

  const testZap = async () => {
    if (!zapUrl) return toast({ title: "Configura la URL primero", variant: "destructive" });
    try {
      await fetch(zapUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          event: "test.ping",
          timestamp: new Date().toISOString(),
          origin: window.location.origin,
        }),
      });
      toast({ title: "Enviado", description: "Revisa el historial de tu Zap" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const generateIcs = async () => {
    const { data } = await supabase
      .from("equipment_bookings")
      .select("id,customer_name,start_date,end_date,status")
      .in("status", ["confirmed", "approved"])
      .order("start_date");
    const events = (data || []).map((b) => {
      const start = String(b.start_date).replace(/-/g, "");
      const end = String(b.end_date).replace(/-/g, "");
      return `BEGIN:VEVENT\nUID:${b.id}@lovable\nSUMMARY:Reserva ${b.customer_name || ""}\nDTSTART;VALUE=DATE:${start}\nDTEND;VALUE=DATE:${end}\nSTATUS:CONFIRMED\nEND:VEVENT`;
    });
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Lovable//Bookings//ES\n${events.join("\n")}\nEND:VCALENDAR`;
    download(`calendario_${Date.now()}.ics`, ics, "text/calendar");
    toast({ title: "Calendario exportado", description: `${events.length} reservas` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integraciones & Automatización</h2>
        <p className="text-sm text-muted-foreground">Conecta el sistema con contabilidad, WhatsApp, Zapier y calendarios externos.</p>
      </div>

      <Tabs defaultValue="accounting">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="accounting"><FileSpreadsheet className="h-4 w-4 mr-1" />Contabilidad</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</TabsTrigger>
          <TabsTrigger value="calendar"><CalIcon className="h-4 w-4 mr-1" />Calendario</TabsTrigger>
          <TabsTrigger value="zapier"><Zap className="h-4 w-4 mr-1" />Zapier / Make</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="h-4 w-4 mr-1" />Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="accounting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exportar a contabilidad</CardTitle>
              <CardDescription>Formatos compatibles con Siigo, Alegra, Xero (CSV) o integraciones custom (JSON).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => exportInvoices("csv")} disabled={busy}><Download className="h-4 w-4 mr-1" />Facturas CSV</Button>
                <Button variant="outline" onClick={() => exportInvoices("json")} disabled={busy}>Facturas JSON</Button>
                <Button onClick={() => exportPOs("csv")} disabled={busy}><Download className="h-4 w-4 mr-1" />Órdenes de Compra CSV</Button>
                <Button variant="outline" onClick={() => exportPOs("json")} disabled={busy}>OC JSON</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Envío rápido por WhatsApp</CardTitle>
              <CardDescription>Abre WhatsApp Web/App con el mensaje pre-llenado. Para envío 100% automático se requiere WhatsApp Business API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Teléfono (con código de país)</Label>
                  <Input value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="+5491112345678" />
                </div>
                <div>
                  <Label>Plantilla</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={waTemplateKey} onChange={(e) => setWaTemplateKey(e.target.value)}>
                    {DEFAULT_WA_TEMPLATES.map((t) => (<option key={t.key} value={t.key}>{t.label}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <Label>Mensaje</Label>
                <Textarea rows={5} value={waBody} onChange={(e) => setWaBody(e.target.value)} />
              </div>
              <Button onClick={sendWhatsApp}><MessageCircle className="h-4 w-4 mr-1" />Abrir en WhatsApp</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exportar calendario (.ics)</CardTitle>
              <CardDescription>Importa reservas confirmadas en Google Calendar, Outlook o Apple Calendar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={generateIcs}><Download className="h-4 w-4 mr-1" />Descargar .ics</Button>
              <p className="text-sm text-muted-foreground">
                Para sincronización bidireccional en tiempo real con Google Calendar podemos habilitar OAuth por usuario — indícanoslo cuando quieras avanzar.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zapier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zapier / Make webhook</CardTitle>
              <CardDescription>Pega la URL de tu Zap "Catch Hook" o escenario de Make para probar la conexión.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Webhook URL</Label>
                <Input value={zapUrl} onChange={(e) => setZapUrl(e.target.value)} placeholder="https://hooks.zapier.com/hooks/catch/..." />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveZap} variant="outline">Guardar</Button>
                <Button onClick={testZap}><Zap className="h-4 w-4 mr-1" />Enviar ping de prueba</Button>
                <Button variant="ghost" asChild><a href="https://zapier.com/apps/webhook/integrations" target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Docs</a></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos disponibles</CardTitle>
              <CardDescription>Estos eventos se emiten desde la sección <b>Webhooks</b> hacia URLs externas (Zapier, Make, n8n).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "booking.created","booking.status_changed","contact.created","application.created",
                  "testimonial.created","quote.created","invoice.created","invoice.paid",
                  "contract.signed","po.created","po.received","work_order.created","work_order.completed",
                ].map((e) => (<Badge key={e} variant="secondary" className="font-mono text-xs">{e}</Badge>))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
