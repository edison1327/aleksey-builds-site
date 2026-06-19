import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Newspaper, ExternalLink } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { slugify } from "@/lib/slugify";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Post {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  content: string;
  content_en: string | null;
  cover_image: string | null;
  author: string | null;
  published: boolean;
  published_at: string | null;
  tags: string[];
  updated_at: string;
}

const emptyForm = {
  slug: "",
  title: "",
  title_en: "",
  excerpt: "",
  excerpt_en: "",
  content: "",
  content_en: "",
  cover_image: "",
  author: "",
  published: false,
  tagsCsv: "",
};

const AdminBlog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setPosts((data as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setDialogOpen(true);
  };

  const openEdit = (p: Post) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      title_en: p.title_en || "",
      excerpt: p.excerpt || "",
      excerpt_en: p.excerpt_en || "",
      content: p.content,
      content_en: p.content_en || "",
      cover_image: p.cover_image || "",
      author: p.author || "",
      published: p.published,
      tagsCsv: p.tags.join(", "),
    });
    setSlugTouched(true);
    setDialogOpen(true);
  };

  const handleTitleChange = (v: string) => {
    setForm((f) => ({
      ...f,
      title: v,
      slug: slugTouched ? f.slug : slugify(v),
    }));
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.slug.trim()) {
      toast({
        title: "Faltan campos",
        description: "Título, slug y contenido son obligatorios.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const payload = {
      slug: slugify(form.slug),
      title: form.title.trim(),
      title_en: form.title_en.trim() || null,
      excerpt: form.excerpt.trim() || null,
      excerpt_en: form.excerpt_en.trim() || null,
      content: form.content,
      content_en: form.content_en.trim() || null,
      cover_image: form.cover_image || null,
      author: form.author.trim() || null,
      published: form.published,
      published_at:
        form.published && !editing?.published_at ? new Date().toISOString() : editing?.published_at ?? null,
      tags: form.tagsCsv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const { error } = editing
      ? await supabase.from("blog_posts").update(payload).eq("id", editing.id)
      : await supabase.from("blog_posts").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Artículo actualizado" : "Artículo creado" });
    setDialogOpen(false);
    load();
  };

  const togglePublish = async (p: Post) => {
    const newVal = !p.published;
    const { error } = await supabase
      .from("blog_posts")
      .update({
        published: newVal,
        published_at: newVal && !p.published_at ? new Date().toISOString() : p.published_at,
      })
      .eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: newVal ? "Publicado" : "Despublicado" });
    load();
  };

  const remove = async (p: Post) => {
    if (!confirm(`¿Eliminar "${p.title}"?`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Eliminado" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold">Blog / Noticias</h2>
          <p className="text-muted-foreground text-sm">
            Publica artículos, casos de éxito y novedades. Mejoran tu SEO y construyen autoridad.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo artículo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Aún no hay artículos. Crea el primero.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {posts.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {p.cover_image && (
                    <img
                      src={p.cover_image}
                      alt={p.title}
                      className="w-24 h-24 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold truncate">{p.title}</p>
                      <Badge variant={p.published ? "default" : "secondary"}>
                        {p.published ? "Publicado" : "Borrador"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">/{p.slug}</p>
                    {p.excerpt && (
                      <p className="text-sm text-foreground/80 line-clamp-2 mt-1">{p.excerpt}</p>
                    )}
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                      {p.author && <span>Por {p.author}</span>}
                      {p.published_at && (
                        <span>
                          • {format(new Date(p.published_at), "dd MMM yyyy", { locale: es })}
                        </span>
                      )}
                      {p.tags.length > 0 && <span>• {p.tags.join(", ")}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <div className="flex gap-1">
                      {p.published && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" aria-label="Ver">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(p)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 text-xs justify-end">
                      <Switch checked={p.published} onCheckedChange={() => togglePublish(p)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
            <DialogDescription>
              El slug se usa en la URL: <code className="text-xs bg-muted px-1 rounded">/blog/tu-slug</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Título (ES) *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  maxLength={200}
                  placeholder="Cómo elegir la maquinaria adecuada"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Title (EN)</Label>
                <Input
                  value={form.title_en}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  maxLength={200}
                  placeholder="Optional English title"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm({ ...form, slug: e.target.value });
                  }}
                  onBlur={() => setForm((f) => ({ ...f, slug: slugify(f.slug) }))}
                  placeholder="como-elegir-maquinaria"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Autor</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Equipo Aleksey"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Resumen (ES)</Label>
                <Textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Breve descripción que aparece en la lista."
                  maxLength={300}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Excerpt (EN)</Label>
                <Textarea
                  value={form.excerpt_en}
                  onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })}
                  rows={2}
                  placeholder="Optional English summary."
                  maxLength={300}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Imagen de portada</Label>
              <ImageUpload
                value={form.cover_image}
                onChange={(url) => setForm({ ...form, cover_image: url })}
                folder="blog"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contenido (ES) *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={12}
                placeholder={"Escribe aquí el artículo. Usa dos saltos para separar párrafos."}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content (EN)</Label>
              <Textarea
                value={form.content_en}
                onChange={(e) => setForm({ ...form, content_en: e.target.value })}
                rows={12}
                placeholder="Optional English version. Falls back to Spanish if empty."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Se renderiza como texto con saltos de línea respetados.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Etiquetas (separadas por coma)</Label>
                <Input
                  value={form.tagsCsv}
                  onChange={(e) => setForm({ ...form, tagsCsv: e.target.value })}
                  placeholder="construcción, maquinaria, tips"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Publicar</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={form.published}
                    onCheckedChange={(v) => setForm({ ...form, published: v })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.published ? "Visible en el sitio" : "Borrador"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
