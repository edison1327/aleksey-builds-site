import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Star, Quote } from "lucide-react";
import ImageUpload from "./ImageUpload";

import { I18nField } from "./I18nField";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  role_en: string | null;
  company: string;
  company_en: string | null;
  content: string;
  content_en: string | null;
  rating: number;
  avatar_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const { toast } = useToast();

  const fetchTestimonials = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Error al cargar testimonios", variant: "destructive" });
    } else {
      setTestimonials(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleSave = async () => {
    if (!editingTestimonial?.name || !editingTestimonial?.content || !editingTestimonial?.company) {
      toast({ title: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      if (editingTestimonial.id) {
        const { error } = await supabase
          .from("testimonials")
          .update({
            name: editingTestimonial.name,
            role: editingTestimonial.role,
            role_en: editingTestimonial.role_en,
            company: editingTestimonial.company,
            company_en: editingTestimonial.company_en,
            content: editingTestimonial.content,
            content_en: editingTestimonial.content_en,
            rating: editingTestimonial.rating || 5,
            avatar_url: editingTestimonial.avatar_url,
            is_active: editingTestimonial.is_active ?? true,
            sort_order: editingTestimonial.sort_order || 0,
          })
          .eq("id", editingTestimonial.id);

        if (error) throw error;
        toast({ title: "Testimonio actualizado" });
      } else {
        const { error } = await supabase.from("testimonials").insert({
          name: editingTestimonial.name,
          role: editingTestimonial.role || "",
          role_en: editingTestimonial.role_en,
          company: editingTestimonial.company,
          company_en: editingTestimonial.company_en,
          content: editingTestimonial.content,
          content_en: editingTestimonial.content_en,
          rating: editingTestimonial.rating || 5,
          avatar_url: editingTestimonial.avatar_url,
          is_active: editingTestimonial.is_active ?? true,
          sort_order: testimonials.length + 1,
        });

        if (error) throw error;
        toast({ title: "Testimonio creado" });
      }

      setIsDialogOpen(false);
      setEditingTestimonial(null);
      fetchTestimonials();
    } catch (error) {
      console.error(error);
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este testimonio?")) return;

    const { error } = await supabase.from("testimonials").delete().eq("id", id);

    if (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    } else {
      toast({ title: "Testimonio eliminado" });
      fetchTestimonials();
    }
  };

  const openNewDialog = () => {
    setEditingTestimonial({
      name: "",
      role: "",
      company: "",
      content: "",
      rating: 5,
      avatar_url: null,
      is_active: true,
      sort_order: testimonials.length + 1,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setIsDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">Testimonios</h2>
          <p className="text-muted-foreground">Gestiona los testimonios de clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo testimonio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial?.id ? "Editar testimonio" : "Nuevo testimonio"}
              </DialogTitle>
            </DialogHeader>
            {editingTestimonial && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={editingTestimonial.name || ""}
                      onChange={(e) =>
                        setEditingTestimonial({ ...editingTestimonial, name: e.target.value })
                      }
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    <Input
                      id="role"
                      value={editingTestimonial.role || ""}
                      onChange={(e) =>
                        setEditingTestimonial({ ...editingTestimonial, role: e.target.value })
                      }
                      placeholder="Ej: Gerente de Proyectos"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  <Input
                    id="company"
                    value={editingTestimonial.company || ""}
                    onChange={(e) =>
                      setEditingTestimonial({ ...editingTestimonial, company: e.target.value })
                    }
                    placeholder="Nombre de la empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Testimonio *</Label>
                  <Textarea
                    id="content"
                    value={editingTestimonial.content || ""}
                    onChange={(e) =>
                      setEditingTestimonial({ ...editingTestimonial, content: e.target.value })
                    }
                    placeholder="El testimonio del cliente..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Calificación</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setEditingTestimonial({ ...editingTestimonial, rating: star })
                          }
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= (editingTestimonial.rating || 5)
                                ? "text-amber-400 fill-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Orden</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={editingTestimonial.sort_order || 0}
                      onChange={(e) =>
                        setEditingTestimonial({
                          ...editingTestimonial,
                          sort_order: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Avatar (opcional)</Label>
                  <ImageUpload
                    value={editingTestimonial.avatar_url || ""}
                    onChange={(url) =>
                      setEditingTestimonial({ ...editingTestimonial, avatar_url: url })
                    }
                    folder="testimonials"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={editingTestimonial.is_active ?? true}
                    onCheckedChange={(checked) =>
                      setEditingTestimonial({ ...editingTestimonial, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Activo (visible en el sitio)</Label>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTestimonial.id ? "Guardar cambios" : "Crear testimonio"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {testimonial.avatar_url ? (
                    <img
                      src={testimonial.avatar_url}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold">
                      {getInitials(testimonial.name)}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-base">{testimonial.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {testimonial.role} • {testimonial.company}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(testimonial)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(testimonial.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                "{testimonial.content}"
              </p>
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`px-2 py-1 rounded-full ${
                    testimonial.is_active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {testimonial.is_active ? "Activo" : "Inactivo"}
                </span>
                <span className="text-muted-foreground">Orden: {testimonial.sort_order}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {testimonials.length === 0 && (
        <Card className="p-12 text-center">
          <Quote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-heading font-bold mb-2">No hay testimonios</h3>
          <p className="text-muted-foreground mb-4">
            Agrega testimonios de tus clientes para mostrarlos en el sitio
          </p>
          <Button onClick={openNewDialog}>Agregar primer testimonio</Button>
        </Card>
      )}
    </div>
  );
};

export default AdminTestimonials;
