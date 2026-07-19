import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, TrendingUp, Target, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Campaign { id: string; name: string; description: string | null; segment_filter: any; is_active: boolean; channel: string; }
interface Step { id: string; campaign_id: string; step_order: number; delay_hours: number; subject: string | null; body: string; }
interface Rule { id: string; name: string; event_type: string; points: number; is_active: boolean; }
interface SourceStat { source: string; count: number; avg_score: number; }

export default function AdminMarketing() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [sourceStats, setSourceStats] = useState<SourceStat[]>([]);
  const [segments, setSegments] = useState<{ segment: string; count: number; avg_score: number }[]>([]);
  const [topLeads, setTopLeads] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [newCamp, setNewCamp] = useState({ name: "", description: "", segment: "" });
  const [newStep, setNewStep] = useState({ delay_hours: 24, subject: "", body: "" });

  const load = async () => {
    const [c, r, l] = await Promise.all([
      supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("lead_scoring_rules").select("*").order("points", { ascending: false }),
      supabase.from("contact_messages").select("utm_source, segment, lead_score, name, email, created_at").is("deleted_at", null),
    ]);
    setCampaigns((c.data as any) || []);
    setRules((r.data as any) || []);

    const leads = l.data || [];
    // Source stats
    const bySrc = new Map<string, { count: number; sum: number }>();
    const bySeg = new Map<string, { count: number; sum: number }>();
    leads.forEach((x: any) => {
      const s = x.utm_source || "directo";
      const seg = x.segment || "sin segmentar";
      const a = bySrc.get(s) || { count: 0, sum: 0 };
      a.count++; a.sum += Number(x.lead_score || 0); bySrc.set(s, a);
      const b = bySeg.get(seg) || { count: 0, sum: 0 };
      b.count++; b.sum += Number(x.lead_score || 0); bySeg.set(seg, b);
    });
    setSourceStats(Array.from(bySrc.entries()).map(([source, v]) => ({ source, count: v.count, avg_score: Math.round(v.sum / v.count) })).sort((a, b) => b.count - a.count));
    setSegments(Array.from(bySeg.entries()).map(([segment, v]) => ({ segment, count: v.count, avg_score: Math.round(v.sum / v.count) })));
    setTopLeads([...leads].sort((a: any, b: any) => (b.lead_score || 0) - (a.lead_score || 0)).slice(0, 10));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedCampaign) { setSteps([]); return; }
    supabase.from("marketing_campaign_steps").select("*").eq("campaign_id", selectedCampaign).order("step_order")
      .then(({ data }) => setSteps((data as any) || []));
  }, [selectedCampaign]);

  const createCampaign = async () => {
    if (!newCamp.name.trim()) return;
    const { error } = await supabase.from("marketing_campaigns").insert({
      name: newCamp.name.trim(),
      description: newCamp.description || null,
      segment_filter: newCamp.segment ? { segment: newCamp.segment } : {},
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setNewCamp({ name: "", description: "", segment: "" });
    toast({ title: "Campaña creada" });
    load();
  };

  const toggleCampaign = async (id: string, is_active: boolean) => {
    await supabase.from("marketing_campaigns").update({ is_active }).eq("id", id);
    load();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("¿Eliminar campaña?")) return;
    await supabase.from("marketing_campaigns").delete().eq("id", id);
    if (selectedCampaign === id) setSelectedCampaign(null);
    load();
  };

  const addStep = async () => {
    if (!selectedCampaign || !newStep.body.trim()) return;
    const order = steps.length + 1;
    await supabase.from("marketing_campaign_steps").insert({
      campaign_id: selectedCampaign,
      step_order: order,
      delay_hours: newStep.delay_hours,
      subject: newStep.subject || null,
      body: newStep.body,
    });
    setNewStep({ delay_hours: 24, subject: "", body: "" });
    const { data } = await supabase.from("marketing_campaign_steps").select("*").eq("campaign_id", selectedCampaign).order("step_order");
    setSteps((data as any) || []);
  };

  const deleteStep = async (id: string) => {
    await supabase.from("marketing_campaign_steps").delete().eq("id", id);
    const { data } = await supabase.from("marketing_campaign_steps").select("*").eq("campaign_id", selectedCampaign!).order("step_order");
    setSteps((data as any) || []);
  };

  const enrollSegment = async (campaign: Campaign) => {
    const seg = (campaign.segment_filter as any)?.segment;
    if (!seg) return toast({ title: "La campaña no tiene segmento filtro", variant: "destructive" });
    const { data: leads } = await supabase.from("contact_messages").select("id").eq("segment", seg).is("deleted_at", null);
    if (!leads?.length) return toast({ title: "Sin leads en ese segmento" });
    const rows = leads.map((l: any) => ({ campaign_id: campaign.id, lead_id: l.id, next_send_at: new Date().toISOString() }));
    const { error } = await supabase.from("marketing_enrollments").upsert(rows, { onConflict: "campaign_id,lead_id" });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: `Inscritos ${rows.length} leads` });
  };

  const updateRule = async (id: string, patch: Partial<Rule>) => {
    await supabase.from("lead_scoring_rules").update(patch).eq("id", id);
    load();
  };

  const addRule = async () => {
    const name = prompt("Nombre de la regla:");
    if (!name) return;
    const pts = Number(prompt("Puntos:", "5") || "5");
    await supabase.from("lead_scoring_rules").insert({ name, event_type: name.toLowerCase().replace(/\s+/g, "_"), points: pts });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold">Marketing & CRM</h2>
        <p className="text-muted-foreground">Segmentación, puntuación de leads y campañas de seguimiento.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview"><TrendingUp className="h-4 w-4 mr-2" />Conversión</TabsTrigger>
          <TabsTrigger value="segments"><Users className="h-4 w-4 mr-2" />Segmentos</TabsTrigger>
          <TabsTrigger value="scoring"><Target className="h-4 w-4 mr-2" />Scoring</TabsTrigger>
          <TabsTrigger value="campaigns"><Zap className="h-4 w-4 mr-2" />Campañas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Leads por fuente</CardTitle><CardDescription>Distribución y puntuación promedio</CardDescription></CardHeader>
            <CardContent>
              {sourceStats.length === 0 ? <p className="text-muted-foreground text-sm">Sin datos aún.</p> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sourceStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Leads" />
                    <Bar dataKey="avg_score" fill="hsl(var(--accent))" name="Score promedio" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top 10 leads por puntuación</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topLeads.map((l: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b py-2 text-sm">
                    <div>
                      <p className="font-medium">{l.name || "Anónimo"}</p>
                      <p className="text-xs text-muted-foreground">{l.email} · {l.segment || "—"} · {l.utm_source || "directo"}</p>
                    </div>
                    <Badge variant="secondary">{l.lead_score || 0} pts</Badge>
                  </div>
                ))}
                {topLeads.length === 0 && <p className="text-muted-foreground text-sm">Sin leads.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Segmentos automáticos</CardTitle><CardDescription>Los leads se segmentan al llegar según su origen.</CardDescription></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {segments.map((s) => (
                <Card key={s.segment} className="p-4">
                  <p className="text-xs uppercase text-muted-foreground">{s.segment}</p>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs text-muted-foreground">Score promedio: {s.avg_score}</p>
                </Card>
              ))}
              {segments.length === 0 && <p className="text-muted-foreground text-sm">Sin datos.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Reglas de puntuación</CardTitle><CardDescription>Se aplican automáticamente al crear un lead.</CardDescription></div>
              <Button size="sm" onClick={addRule}><Plus className="h-4 w-4 mr-2" />Nueva</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rules.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 border-b py-2">
                    <Switch checked={r.is_active} onCheckedChange={(v) => updateRule(r.id, { is_active: v })} />
                    <div className="flex-1"><p className="text-sm font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.event_type}</p></div>
                    <Input type="number" className="w-20" value={r.points} onChange={(e) => updateRule(r.id, { points: Number(e.target.value) })} />
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Nueva campaña de seguimiento</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div><Label>Nombre</Label><Input value={newCamp.name} onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })} placeholder="Seguimiento leads campaña" /></div>
              <div>
                <Label>Segmento objetivo</Label>
                <Select value={newCamp.segment} onValueChange={(v) => setNewCamp({ ...newCamp, segment: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {segments.map((s) => <SelectItem key={s.segment} value={s.segment}>{s.segment}</SelectItem>)}
                    <SelectItem value="campaña">campaña</SelectItem>
                    <SelectItem value="referido">referido</SelectItem>
                    <SelectItem value="orgánico">orgánico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>Descripción</Label><Textarea rows={2} value={newCamp.description} onChange={(e) => setNewCamp({ ...newCamp, description: e.target.value })} /></div>
              <div className="sm:col-span-2"><Button onClick={createCampaign}><Plus className="h-4 w-4 mr-2" />Crear</Button></div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Campañas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {campaigns.map((c) => (
                  <div key={c.id} className={`border rounded-lg p-3 ${selectedCampaign === c.id ? "border-primary" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <button className="text-left flex-1" onClick={() => setSelectedCampaign(c.id)}>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                        <div className="flex gap-1 mt-1">
                          {(c.segment_filter as any)?.segment && <Badge variant="outline" className="text-[10px]">{(c.segment_filter as any).segment}</Badge>}
                          <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px]">{c.is_active ? "Activa" : "Pausada"}</Badge>
                        </div>
                      </button>
                      <div className="flex flex-col gap-1">
                        <Switch checked={c.is_active} onCheckedChange={(v) => toggleCampaign(c.id, v)} />
                        <Button size="icon" variant="ghost" onClick={() => deleteCampaign(c.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => enrollSegment(c)}>Inscribir leads del segmento</Button>
                  </div>
                ))}
                {campaigns.length === 0 && <p className="text-sm text-muted-foreground">Sin campañas.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Pasos {selectedCampaign ? "" : "(selecciona una campaña)"}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {selectedCampaign && (
                  <>
                    {steps.map((s) => (
                      <div key={s.id} className="border rounded p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge>Paso {s.step_order} · +{s.delay_hours}h</Badge>
                          <Button size="icon" variant="ghost" onClick={() => deleteStep(s.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                        {s.subject && <p className="text-sm font-medium">{s.subject}</p>}
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{s.body}</p>
                      </div>
                    ))}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1"><Label className="text-xs">Retardo (h)</Label><Input type="number" value={newStep.delay_hours} onChange={(e) => setNewStep({ ...newStep, delay_hours: Number(e.target.value) })} /></div>
                        <div className="flex-[2]"><Label className="text-xs">Asunto</Label><Input value={newStep.subject} onChange={(e) => setNewStep({ ...newStep, subject: e.target.value })} /></div>
                      </div>
                      <div><Label className="text-xs">Cuerpo del mensaje</Label><Textarea rows={4} value={newStep.body} onChange={(e) => setNewStep({ ...newStep, body: e.target.value })} placeholder="Hola {{nombre}}, ..." /></div>
                      <Button size="sm" onClick={addStep}><Plus className="h-4 w-4 mr-2" />Añadir paso</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            Los envíos se activarán automáticamente cuando el dominio de email esté configurado. Mientras tanto, las inscripciones y los pasos quedan preparados.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
