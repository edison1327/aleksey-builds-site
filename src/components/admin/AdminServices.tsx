import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, GripVertical, GripHorizontal } from "lucide-react";
import ImageUpload from "./ImageUpload";
import { SortableGrid } from "./SortableGrid";
import { logAction } from "@/lib/auditLog";

interface Service {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  features: string[] | null;
  is_active: boolean;
  sort_order: number;
}

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching services:", error);
    } else {
      setServices(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!editingService) return;

    try {
      if (editingService.id) {
        const { error } = await supabase
          .from("services")
          .update({
            title: editingService.title,
            description: editingService.description,
            icon: editingService.icon,
            image_url: editingService.image_url,
            features: editingService.features,
            is_active: editingService.is_active,
            sort_order: editingService.sort_order,
          })
          .eq("id", editingService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("services")
          .insert({
            title: editingService.title,
            description: editingService.description,
            icon: editingService.icon,
            image_url: editingService.image_url,
            features: editingService.features,
            is_active: editingService.is_active,
            sort_order: services.length,
          });

        if (error) throw error;
      }

      toast({ title: "Guardado", description: "Servicio actualizado correctamente." });
      logAction(editingService.id ? "update" : "create", "services", editingService.id || undefined, { title: editingService.title });
      setIsDialogOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este servicio?")) return;
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "Servicio eliminado correctamente." });
      logAction("delete", "services", id);
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleReorder = async (newOrder: Service[]) => {
    setServices(newOrder);
    try {
      await Promise.all(
        newOrder.map((s, idx) => supabase.from("services").update({ sort_order: idx }).eq("id", s.id)),
      );
      logAction("reorder", "services", null, { count: newOrder.length });
      toast({ title: "Orden actualizado" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo guardar el orden.", variant: "destructive" });
      fetchServices();
    }
  };

  const openNewDialog = () => {
    setEditingService({
      id: "",
      title: "",
      description: "",
      icon: "Building2",
      image_url: "",
      features: [],
      is_active: true,
      sort_order: services.length,
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
          <h2 className="text-2xl font-heading font-bold">Servicios</h2>
          <p className="text-muted-foreground">Administra los servicios de la empresa</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className={`overflow-hidden ${!service.is_active ? "opacity-50" : ""}`}>
            {service.image_url && (
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={service.image_url} 
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{service.title}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingService(service);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-1 rounded ${service.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {service.is_active ? "Activo" : "Inactivo"}
                </span>
                {!service.image_url && (
                  <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                    Sin imagen
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService?.id ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={editingService?.title || ""}
                onChange={(e) => setEditingService(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={editingService?.description || ""}
                onChange={(e) => setEditingService(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Icono (nombre de Lucide)</label>
              <Input
                value={editingService?.icon || ""}
                onChange={(e) => setEditingService(prev => prev ? { ...prev, icon: e.target.value } : null)}
                placeholder="Building2, Wrench, Truck..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Imagen</label>
              <ImageUpload
                value={editingService?.image_url || ""}
                onChange={(url) => setEditingService(prev => prev ? { ...prev, image_url: url } : null)}
                folder="services"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editingService?.is_active || false}
                onCheckedChange={(checked) => setEditingService(prev => prev ? { ...prev, is_active: checked } : null)}
              />
              <label className="text-sm font-medium">Activo</label>
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

export default AdminServices;
