import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlarmClock, Plus, Pencil, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

interface ReminderTemplate {
  id: string;
  key: string;
  name: string;
  title: string;
  message: string;
  offset_hours: number;
  is_active: boolean;
  updated_at: string;
}

const empty: Partial<ReminderTemplate> = {
  key: "", name: "", title: "", message: "", offset_hours: 0, is_active: true,
};

const AdminReminderTemplates = () => {
  const [items, setItems] = useState<ReminderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ReminderTemplate> | null>(null);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reminder_templates")
      .select("*")
      .order("key");
    if (error) toast.error(error.message);
    else setItems((data as ReminderTemplate[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.key || !editing.name || !editing.title || !editing.message) {
      toast.error("Completa clave, nombre, título y mensaje");
      return;
    }
    const payload = {
      key: editing.key.trim(),
      name: editing.name,
      title: editing.title,
      message: editing.message,
      offset_hours: Number(editing.offset_hours ?? 0),
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("reminder_templates").update(payload).eq("id", editing.id)
      : await supabase.from("reminder_templates").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Plantilla guardada");
      setEditing(null);
      load();
    }
  };

  const toggle = async (row: ReminderTemplate) => {
    await supabase.from("reminder_templates").update({ is_active: !row.is_active }).eq("id", row.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    await supabase.from("reminder_templates").delete().eq("id", id);
    load();
  };

  const runNow = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("pipeline-reminders");
    setRunning(false);
    if (error) toast.error(error.message);
    else toast.success(`Ejecutado: ${data?.processed ?? 0} pendientes, ${data?.created ?? 0} avisos creados`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <AlarmClock className="h-7 w-7 text-primary" /> Plantillas de recordatorios
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Ola M · Personaliza los avisos automáticos del pipeline. Usa <code className="text-xs bg-muted px-1 rounded">{"{name}"}</code>, <code className="text-xs bg-muted px-1 rounded">{"{action}"}</code>, <code className="text-xs bg-muted px-1 rounded">{"{stage}"}</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runNow} disabled={running}>
            <Play className="h-4 w-4 mr-2" /> {running ? "Ejecutando…" : "Ejecutar ahora"}
          </Button>
          <Button size="sm" onClick={() => setEditing({ ...empty })}>
            <Plus className="h-4 w-4 mr-2" /> Nueva plantilla
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Sin plantillas todavía. Crea la primera para activar los recordatorios.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{t.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{t.key}</CardDescription>
                  </div>
                  <Badge variant={t.is_active ? "default" : "outline"}>{t.is_active ? "Activa" : "Pausada"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Título</p>
                  <p className="font-medium">{t.title}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Mensaje</p>
                  <p className="text-sm">{t.message}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Desfase: {t.offset_hours}h</span>
                  <div className="flex items-center gap-1">
                    <Switch checked={t.is_active} onCheckedChange={() => toggle(t)} />
                    <Button variant="ghost" size="icon" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Clave interna</Label>
                <Input value={editing.key ?? ""} onChange={(e) => setEditing({ ...editing, key: e.target.value })} placeholder="pipeline_overdue" disabled={!!editing.id} />
              </div>
              <div>
                <Label>Nombre</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Título de la notificación</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Mensaje</Label>
                <Textarea rows={3} value={editing.message ?? ""} onChange={(e) => setEditing({ ...editing, message: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">Placeholders: {"{name}, {action}, {stage}"}</p>
              </div>
              <div>
                <Label>Desfase (horas)</Label>
                <Input type="number" value={editing.offset_hours ?? 0} onChange={(e) => setEditing({ ...editing, offset_hours: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground mt-1">0 = al vencer · negativo = antes · positivo = después</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Activa</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReminderTemplates;
