import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  MessageCircle,
  Zap,
  Webhook,
  Calendar as CalIcon,
  FileSpreadsheet,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
} from "lucide-react";

// ---------- helpers ----------
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

// ---------- WhatsApp templates persistence ----------
type WaTemplate = { key: string; label: string; body: string };

const DEFAULT_WA_TEMPLATES: WaTemplate[] = [
  { key: "cobro", label: "Recordatorio de cobro", body: "Hola {nombre}, te recordamos que la factura {codigo} por {monto} vence el {vencimiento}. Puedes pagarla aquí: {enlace}. ¡Gracias!" },
  { key: "reserva", label: "Confirmación de reserva", body: "Hola {nombre}, tu reserva del {fecha} está confirmada. Cualquier duda contáctanos por este medio." },
  { key: "ot", label: "OT en camino", body: "Hola {nombre}, tu OT {codigo} fue asignada y nuestro equipo se comunicará en breve." },
];

const WA_STORAGE_KEY = "wa_templates_v1";

function loadWaTemplates(): WaTemplate[] {
  try {
    const raw = localStorage.getItem(WA_STORAGE_KEY);
    if (!raw) return DEFAULT_WA_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULT_WA_TEMPLATES;
  } catch {
    return DEFAULT_WA_TEMPLATES;
  }
}

function saveWaTemplates(list: WaTemplate[]) {
  localStorage.setItem(WA_STORAGE_KEY, JSON.stringify(list));
}

// ---------- connector test state ----------
type TestStatus = "idle" | "running" | "ok" | "fail";
interface TestResult { status: TestStatus; message?: string; at?: string }

const initialTest: TestResult = { status: "idle" };

function StatusPill({ r }: { r: TestResult }) {
  if (r.status === "idle") return <Badge variant="outline">No probado</Badge>;
  if (r.status === "running") return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Probando…</Badge>;
  if (r.status === "ok") return <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>;
  return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falló</Badge>;
}

export default function AdminIntegrations() {
  const { toast } = useToast();
  const [zapUrl, setZapUrl] = useState(localStorage.getItem("zap_webhook_url") || "");
  const [waPhone, setWaPhone] = useState("");
  const [waTemplates, setWaTemplates] = useState<WaTemplate[]>(() => loadWaTemplates());
  const [waTemplateKey, setWaTemplateKey] = useState<string>(() => loadWaTemplates()[0]?.key ?? "");
  const [waBody, setWaBody] = useState<string>(() => loadWaTemplates()[0]?.body ?? "");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editBody, setEditBody] = useState("");
  const [busy, setBusy] = useState(false);

  // Test results per connector
  const [tests, setTests] = useState<Record<string, TestResult>>({
    accounting: initialTest,
    whatsapp: initialTest,
    calendar: initialTest,
    zapier: initialTest,
  });

  const setTest = (key: string, r: TestResult) =>
    setTests((prev) => ({ ...prev, [key]: { ...r, at: new Date().toLocaleTimeString() } }));

  const currentTemplate = useMemo(
    () => waTemplates.find((t) => t.key === waTemplateKey) ?? waTemplates[0],
    [waTemplates, waTemplateKey],
  );

  useEffect(() => {
    if (currentTemplate) setWaBody(currentTemplate.body);
  }, [waTemplateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- WA template editor ----------
  const startEdit = (t: WaTemplate) => {
    setEditingKey(t.key);
    setEditLabel(t.label);
    setEditBody(t.body);
  };

  const saveEdit = () => {
    if (!editingKey) return;
    const label = editLabel.trim();
    const body = editBody.trim();
    if (!label || !body) return toast({ title: "Completa nombre y mensaje", variant: "destructive" });
    const next = waTemplates.map((t) => (t.key === editingKey ? { ...t, label, body } : t));
    setWaTemplates(next);
    saveWaTemplates(next);
    if (waTemplateKey === editingKey) setWaBody(body);
    setEditingKey(null);
    toast({ title: "Plantilla guardada" });
  };

  const addTemplate = () => {
    const key = `custom-${Date.now()}`;
    const next: WaTemplate[] = [
      ...waTemplates,
      { key, label: "Nueva plantilla", body: "Hola {nombre}, …" },
    ];
    setWaTemplates(next);
    saveWaTemplates(next);
    startEdit(next[next.length - 1]);
  };

  const removeTemplate = (key: string) => {
    if (waTemplates.length <= 1) return toast({ title: "Debe existir al menos una plantilla", variant: "destructive" });
    const next = waTemplates.filter((t) => t.key !== key);
    setWaTemplates(next);
    saveWaTemplates(next);
    if (waTemplateKey === key) {
      setWaTemplateKey(next[0].key);
      setWaBody(next[0].body);
    }
    if (editingKey === key) setEditingKey(null);
  };

  const resetTemplates = () => {
    setWaTemplates(DEFAULT_WA_TEMPLATES);
    saveWaTemplates(DEFAULT_WA_TEMPLATES);
    setWaTemplateKey(DEFAULT_WA_TEMPLATES[0].key);
    setWaBody(DEFAULT_WA_TEMPLATES[0].body);
    setEditingKey(null);
    toast({ title: "Plantillas restauradas" });
  };

  // ---------- exports ----------
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

  // ---------- connector tests ----------
  const testAccounting = async () => {
    setTest("accounting", { status: "running" });
    const [inv, po] = await Promise.all([
      supabase.from("invoices").select("id", { count: "exact", head: true }),
      supabase.from("purchase_orders").select("id", { count: "exact", head: true }),
    ]);
    if (inv.error || po.error) {
      return setTest("accounting", { status: "fail", message: inv.error?.message || po.error?.message });
    }
    setTest("accounting", {
      status: "ok",
      message: `Facturas: ${inv.count ?? 0} · Órdenes de compra: ${po.count ?? 0} listas para exportar.`,
    });
  };

  const testWhatsApp = () => {
    setTest("whatsapp", { status: "running" });
    const phone = waPhone.replace(/[^\d]/g, "");
    if (!phone) return setTest("whatsapp", { status: "fail", message: "Falta el número de teléfono con código de país." });
    if (phone.length < 8) return setTest("whatsapp", { status: "fail", message: "Número inválido (mínimo 8 dígitos)." });
    if (!waBody.trim()) return setTest("whatsapp", { status: "fail", message: "El mensaje está vacío." });
    const testMsg = "🧪 Prueba de integración WhatsApp desde el CMS";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(testMsg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setTest("whatsapp", { status: "ok", message: `Enlace abierto para +${phone}. Confirma en WhatsApp que llegó.` });
  };

  const testCalendar = async () => {
    setTest("calendar", { status: "running" });
    const { count, error } = await supabase
      .from("equipment_bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["confirmed", "approved"]);
    if (error) return setTest("calendar", { status: "fail", message: error.message });
    setTest("calendar", {
      status: "ok",
      message: `${count ?? 0} reservas confirmadas disponibles para .ics.`,
    });
  };

  const testZap = async () => {
    if (!zapUrl) return setTest("zapier", { status: "fail", message: "Configura la URL primero." });
    setTest("zapier", { status: "running" });
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
      setTest("zapier", { status: "ok", message: "Ping enviado. Revisa el historial del Zap para confirmar recepción." });
    } catch (e: any) {
      setTest("zapier", { status: "fail", message: e.message });
    }
  };

  const testAll = async () => {
    await Promise.all([testAccounting(), testCalendar()]);
    if (zapUrl) await testZap();
    toast({ title: "Pruebas ejecutadas", description: "Revisa el estado de cada conector." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Integraciones & Automatización</h2>
          <p className="text-sm text-muted-foreground">Conecta el sistema con contabilidad, WhatsApp, Zapier y calendarios externos.</p>
        </div>
        <Button onClick={testAll} variant="outline">
          <PlayCircle className="h-4 w-4 mr-1" />Probar todos los conectores
        </Button>
      </div>

      <Tabs defaultValue="accounting">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="accounting"><FileSpreadsheet className="h-4 w-4 mr-1" />Contabilidad</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</TabsTrigger>
          <TabsTrigger value="calendar"><CalIcon className="h-4 w-4 mr-1" />Calendario</TabsTrigger>
          <TabsTrigger value="zapier"><Zap className="h-4 w-4 mr-1" />Zapier / Make</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="h-4 w-4 mr-1" />Eventos</TabsTrigger>
        </TabsList>

        {/* ---------------- ACCOUNTING ---------------- */}
        <TabsContent value="accounting" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Exportar a contabilidad</CardTitle>
                  <CardDescription>Formatos compatibles con Siigo, Alegra, Xero (CSV) o integraciones custom (JSON).</CardDescription>
                </div>
                <StatusPill r={tests.accounting} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => exportInvoices("csv")} disabled={busy}><Download className="h-4 w-4 mr-1" />Facturas CSV</Button>
                <Button variant="outline" onClick={() => exportInvoices("json")} disabled={busy}>Facturas JSON</Button>
                <Button onClick={() => exportPOs("csv")} disabled={busy}><Download className="h-4 w-4 mr-1" />Órdenes de Compra CSV</Button>
                <Button variant="outline" onClick={() => exportPOs("json")} disabled={busy}>OC JSON</Button>
                <Button variant="secondary" onClick={testAccounting}><PlayCircle className="h-4 w-4 mr-1" />Probar conector</Button>
              </div>
              {tests.accounting.message && (
                <p className="text-xs text-muted-foreground">{tests.accounting.message}{tests.accounting.at && ` · ${tests.accounting.at}`}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- WHATSAPP ---------------- */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Envío rápido por WhatsApp</CardTitle>
                  <CardDescription>Abre WhatsApp Web/App con el mensaje pre-llenado. Para envío 100% automático se requiere WhatsApp Business API.</CardDescription>
                </div>
                <StatusPill r={tests.whatsapp} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Teléfono (con código de país)</Label>
                  <Input value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="+5491112345678" />
                </div>
                <div>
                  <Label>Plantilla</Label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={waTemplateKey}
                    onChange={(e) => setWaTemplateKey(e.target.value)}
                  >
                    {waTemplates.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>Mensaje</Label>
                <Textarea rows={5} value={waBody} onChange={(e) => setWaBody(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={sendWhatsApp}><MessageCircle className="h-4 w-4 mr-1" />Abrir en WhatsApp</Button>
                <Button variant="secondary" onClick={testWhatsApp}><PlayCircle className="h-4 w-4 mr-1" />Probar conector</Button>
              </div>
              {tests.whatsapp.message && (
                <p className="text-xs text-muted-foreground">{tests.whatsapp.message}{tests.whatsapp.at && ` · ${tests.whatsapp.at}`}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Editor de plantillas</CardTitle>
                  <CardDescription>Personaliza los mensajes. Usa variables entre llaves: <code>{'{nombre}'}</code>, <code>{'{codigo}'}</code>, <code>{'{monto}'}</code>, <code>{'{fecha}'}</code>, <code>{'{enlace}'}</code>.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addTemplate}><Plus className="h-4 w-4 mr-1" />Nueva</Button>
                  <Button size="sm" variant="outline" onClick={resetTemplates}>Restaurar</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {waTemplates.map((t) => {
                const isEditing = editingKey === t.key;
                return (
                  <div key={t.key} className="rounded-md border p-3 space-y-2">
                    {isEditing ? (
                      <>
                        <div>
                          <Label>Nombre</Label>
                          <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                        </div>
                        <div>
                          <Label>Mensaje</Label>
                          <Textarea rows={4} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}>Guardar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>Cancelar</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{t.label}</p>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">{t.body}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => startEdit(t)}>Editar</Button>
                            <Button size="sm" variant="ghost" onClick={() => removeTemplate(t.key)} aria-label="Eliminar plantilla">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- CALENDAR ---------------- */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Exportar calendario (.ics)</CardTitle>
                  <CardDescription>Importa reservas confirmadas en Google Calendar, Outlook o Apple Calendar.</CardDescription>
                </div>
                <StatusPill r={tests.calendar} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button onClick={generateIcs}><Download className="h-4 w-4 mr-1" />Descargar .ics</Button>
                <Button variant="secondary" onClick={testCalendar}><PlayCircle className="h-4 w-4 mr-1" />Probar conector</Button>
              </div>
              {tests.calendar.message && (
                <p className="text-xs text-muted-foreground">{tests.calendar.message}{tests.calendar.at && ` · ${tests.calendar.at}`}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Para sincronización bidireccional en tiempo real con Google Calendar podemos habilitar OAuth por usuario — indícanoslo cuando quieras avanzar.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- ZAPIER ---------------- */}
        <TabsContent value="zapier" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Zapier / Make webhook</CardTitle>
                  <CardDescription>Pega la URL de tu Zap "Catch Hook" o escenario de Make para probar la conexión.</CardDescription>
                </div>
                <StatusPill r={tests.zapier} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Webhook URL</Label>
                <Input value={zapUrl} onChange={(e) => setZapUrl(e.target.value)} placeholder="https://hooks.zapier.com/hooks/catch/..." />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveZap} variant="outline">Guardar</Button>
                <Button onClick={testZap}><PlayCircle className="h-4 w-4 mr-1" />Enviar ping de prueba</Button>
                <Button variant="ghost" asChild><a href="https://zapier.com/apps/webhook/integrations" target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Docs</a></Button>
              </div>
              {tests.zapier.message && (
                <p className="text-xs text-muted-foreground">{tests.zapier.message}{tests.zapier.at && ` · ${tests.zapier.at}`}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- WEBHOOK EVENTS ---------------- */}
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
