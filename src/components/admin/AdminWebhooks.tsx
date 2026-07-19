import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Send, Copy, Loader2, Webhook, Activity } from "lucide-react";

interface WebhookRow {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  "booking.created",
  "contact.created",
  "application.created",
  "testimonial.created",
  "quote.created",
];

export default function AdminWebhooks() {
  const { toast } = useToast();
  const [hooks, setHooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", url: "", events: ["booking.created", "contact.created"] });
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("webhooks").select("*").order("created_at", { ascending: false });
    setHooks((data as any) ?? []);
    const { data: d } = await supabase
      .from("webhook_deliveries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setDeliveries(d ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.name || !draft.url) return;
    setSaving(true);
    const { error } = await supabase.from("webhooks").insert({
      name: draft.name, url: draft.url, events: draft.events,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Webhook creado" });
    setOpen(false);
    setDraft({ name: "", url: "", events: ["booking.created", "contact.created"] });
    load();
  };

  const toggleActive = async (h: WebhookRow) => {
    await supabase.from("webhooks").update({ is_active: !h.is_active }).eq("id", h.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar webhook?")) return;
    await supabase.from("webhooks").delete().eq("id", id);
    load();
  };

  const testFire = async (h: WebhookRow) => {
    setSendingId(h.id);
    const { data, error } = await supabase.functions.invoke("dispatch-webhook", {
      body: { event: "test.ping", payload: { message: "Test desde admin" }, webhook_id: h.id },
    });
    setSendingId(null);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Enviado", description: JSON.stringify(data?.results?.[0] ?? data) });
    load();
  };

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast({ title: "Copiado" }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Webhook className="w-6 h-6" /> Webhooks</h2>
          <p className="text-sm text-muted-foreground">Notifica sistemas externos (Zapier, Make, n8n, tu propio backend) cuando ocurran eventos.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nuevo</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : hooks.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Sin webhooks configurados</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {hooks.map((h) => (
            <Card key={h.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {h.name}
                    <Badge variant={h.is_active ? "default" : "secondary"}>{h.is_active ? "Activo" : "Inactivo"}</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground break-all mt-1">{h.url}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {h.events.map((e) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={h.is_active} onCheckedChange={() => toggleActive(h)} />
                  <Button size="sm" variant="outline" onClick={() => testFire(h)} disabled={sendingId === h.id}>
                    {sendingId === h.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copy(h.secret)} title="Copiar secret">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(h.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Últimos envíos</CardTitle></CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin envíos aún.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {deliveries.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b py-1">
                  <span className="truncate">{new Date(d.created_at).toLocaleString()} · {d.event}</span>
                  <Badge variant={d.ok ? "default" : "destructive"}>{d.status_code || "err"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo webhook</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input placeholder="https://..." value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
            <div>
              <p className="text-sm font-medium mb-2">Eventos</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EVENTS.map((ev) => {
                  const on = draft.events.includes(ev);
                  return (
                    <button key={ev} type="button" onClick={() => setDraft({
                      ...draft,
                      events: on ? draft.events.filter(e => e !== ev) : [...draft.events, ev],
                    })} className={`text-xs px-2 py-1 rounded border ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                      {ev}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
