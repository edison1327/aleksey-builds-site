import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Star, Images, GripHorizontal } from "lucide-react";
import ImageUpload from "./ImageUpload";
import MultiImageUpload from "./MultiImageUpload";
import { SortableGrid } from "./SortableGrid";
import { logAction } from "@/lib/auditLog";
import { I18nField } from "./I18nField";

interface Project {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  category: string | null;
  category_en: string | null;
  location: string | null;
  location_en: string | null;
  year: number | null;
  image_url: string | null;
  gallery_images: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!editingProject) return;

    try {
      if (editingProject.id) {
        const { error } = await supabase
          .from("projects")
          .update({
            title: editingProject.title,
            title_en: editingProject.title_en,
            description: editingProject.description,
            description_en: editingProject.description_en,
            category: editingProject.category,
            category_en: editingProject.category_en,
            location: editingProject.location,
            location_en: editingProject.location_en,
            year: editingProject.year,
            image_url: editingProject.image_url,
            gallery_images: editingProject.gallery_images,
            is_featured: editingProject.is_featured,
            is_active: editingProject.is_active,
            sort_order: editingProject.sort_order,
          })
          .eq("id", editingProject.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("projects")
          .insert({
            title: editingProject.title,
            title_en: editingProject.title_en,
            description: editingProject.description,
            description_en: editingProject.description_en,
            category: editingProject.category,
            category_en: editingProject.category_en,
            location: editingProject.location,
            location_en: editingProject.location_en,
            year: editingProject.year,
            image_url: editingProject.image_url,
            gallery_images: editingProject.gallery_images,
            is_featured: editingProject.is_featured,
            is_active: editingProject.is_active,
            sort_order: projects.length,
          });

        if (error) throw error;
      }

      toast({ title: "Guardado", description: "Proyecto actualizado correctamente." });
      logAction(editingProject.id ? "update" : "create", "projects", editingProject.id || undefined, { title: editingProject.title });
      setIsDialogOpen(false);
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este proyecto?")) return;
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "Proyecto eliminado correctamente." });
      logAction("delete", "projects", id);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleReorder = async (newOrder: Project[]) => {
    setProjects(newOrder);
    try {
      await Promise.all(
        newOrder.map((p, idx) => supabase.from("projects").update({ sort_order: idx }).eq("id", p.id)),
      );
      logAction("reorder", "projects", null, { count: newOrder.length });
      toast({ title: "Orden actualizado" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo guardar el orden.", variant: "destructive" });
      fetchProjects();
    }
  };

  const openNewDialog = () => {
    setEditingProject({
      id: "",
      title: "",
      description: "",
      category: "",
      location: "",
      year: new Date().getFullYear(),
      image_url: "",
      gallery_images: [],
      is_featured: false,
      is_active: true,
      sort_order: projects.length,
    });
    setIsDialogOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Proyectos</h2>
          <p className="text-muted-foreground">Administra el portafolio de proyectos</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-md">
        <GripHorizontal className="h-4 w-4" />
        Arrastra desde el ícono de la esquina superior izquierda para reordenar.
      </div>

      <SortableGrid
        items={projects}
        onReorder={handleReorder}
        renderItem={(project) => (
          <Card className={!project.is_active ? "opacity-50" : ""}>
            <CardHeader className="pb-2 pl-12">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  {project.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingProject(project); setIsDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.category && (
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{project.category}</span>
                )}
                {project.year && (
                  <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{project.year}</span>
                )}
                {project.gallery_images && project.gallery_images.length > 0 && (
                  <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground flex items-center gap-1">
                    <Images className="h-3 w-3" />
                    {project.gallery_images.length + 1}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject?.id ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={editingProject?.title || ""}
                onChange={(e) => setEditingProject(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={editingProject?.description || ""}
                onChange={(e) => setEditingProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Categoría</label>
                <Input
                  value={editingProject?.category || ""}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, category: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ubicación</label>
                <Input
                  value={editingProject?.location || ""}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, location: e.target.value } : null)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Año</label>
              <Input
                type="number"
                value={editingProject?.year || ""}
                onChange={(e) => setEditingProject(prev => prev ? { ...prev, year: parseInt(e.target.value) || null } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Imagen</label>
              <ImageUpload
                value={editingProject?.image_url || ""}
                onChange={(url) => setEditingProject(prev => prev ? { ...prev, image_url: url } : null)}
                folder="projects"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Galería de imágenes adicionales</label>
              <MultiImageUpload
                value={editingProject?.gallery_images || []}
                onChange={(urls) => setEditingProject(prev => prev ? { ...prev, gallery_images: urls } : null)}
                folder="projects/gallery"
                maxImages={10}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingProject?.is_featured || false}
                  onCheckedChange={(checked) => setEditingProject(prev => prev ? { ...prev, is_featured: checked } : null)}
                />
                <label className="text-sm font-medium">Destacado</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingProject?.is_active || false}
                  onCheckedChange={(checked) => setEditingProject(prev => prev ? { ...prev, is_active: checked } : null)}
                />
                <label className="text-sm font-medium">Activo</label>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProjects;
