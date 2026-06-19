import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, FileText } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  category: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "quote", label: "Cotización" },
  { value: "contact", label: "Contacto" },
  { value: "followup", label: "Seguimiento" },
  { value: "rejection", label: "Rechazo cordial" },
];

const empty = { name: "", subject: "", body: "", category: "general" };

const AdminResponseTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("response_templates")
      .select("*")
      .order("category")
      .order("name");
    if (!error) setTemplates((data as Template[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, subject: t.subject || "", body: t.body, category: t.category });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast({ title: "Campos requeridos", description: "Nombre y cuerpo son obligatorios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      subject: form.subject.trim() || null,
      body: form.body,
      category: form.category,
    };
    const { error } = editing
      ? await supabase.from("response_templates").update(payload).eq("id", editing.id)
      : await supabase.from("response_templates").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Plantilla actualizada" : "Plantilla creada" });
    setDialogOpen(false);
    load();
  };

  const remove = async (t: Template) => {
    if (!confirm(`¿Eliminar la plantilla "${t.name}"?`)) return;
    const { error } = await supabase.from("response_templates").delete().eq("id", t.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Eliminada" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold">Plantillas de Respuesta</h2>
          <p className="text-muted-foreground text-sm">
            Crea textos predefinidos para responder mensajes y cotizaciones en segundos. Usa{" "}
            <code className="text-xs bg-muted px-1 rounded">{"{{name}}"}</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">{"{{equipo}}"}</code> para personalizar.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Nueva plantilla
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No hay plantillas todavía. Crea la primera para acelerar tus respuestas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold">{t.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIES.find((c) => c.value === t.category)?.label || t.category}
                      </Badge>
                    </div>
                    {t.subject && (
                      <p className="text-sm text-muted-foreground italic mb-1">Asunto: {t.subject}</p>
                    )}
                    <p className="text-sm line-clamp-2 text-foreground/80 whitespace-pre-wrap">
                      {t.body}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(t)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
            <DialogDescription>
              Las variables{" "}
              <code className="text-xs bg-muted px-1 rounded">{"{{name}}"}</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">{"{{equipo}}"}</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">{"{{empresa}}"}</code> se reemplazan al usar la plantilla.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Confirmación cotización"
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Asunto (opcional)</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Re: Su solicitud de cotización"
                maxLength={150}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cuerpo *</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={10}
                placeholder={"Estimado/a {{name}},\n\nGracias por su interés en {{equipo}}..."}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editing ? "Guardar cambios" : "Crear plantilla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminResponseTemplates;
