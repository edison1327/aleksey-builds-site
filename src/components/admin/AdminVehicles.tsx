import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

interface Vehicle {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  image_url: string | null;
  is_available: boolean;
  is_active: boolean;
  sort_order: number;
}

const AdminVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching vehicles:", error);
    } else {
      setVehicles(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!editingVehicle) return;

    try {
      if (editingVehicle.id) {
        const { error } = await supabase
          .from("vehicles")
          .update({
            name: editingVehicle.name,
            description: editingVehicle.description,
            category: editingVehicle.category,
            brand: editingVehicle.brand,
            model: editingVehicle.model,
            image_url: editingVehicle.image_url,
            is_available: editingVehicle.is_available,
            is_active: editingVehicle.is_active,
            sort_order: editingVehicle.sort_order,
          })
          .eq("id", editingVehicle.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert({
            name: editingVehicle.name,
            description: editingVehicle.description,
            category: editingVehicle.category,
            brand: editingVehicle.brand,
            model: editingVehicle.model,
            image_url: editingVehicle.image_url,
            is_available: editingVehicle.is_available,
            is_active: editingVehicle.is_active,
            sort_order: vehicles.length,
          });

        if (error) throw error;
      }

      toast({ title: "Guardado", description: "Vehículo actualizado correctamente." });
      setIsDialogOpen(false);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este vehículo?")) return;

    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "Vehículo eliminado correctamente." });
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const openNewDialog = () => {
    setEditingVehicle({
      id: "",
      name: "",
      description: "",
      category: "",
      brand: "",
      model: "",
      image_url: "",
      is_available: true,
      is_active: true,
      sort_order: vehicles.length,
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
          <h2 className="text-2xl font-heading font-bold">Vehículos</h2>
          <p className="text-muted-foreground">Administra el catálogo de vehículos</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo vehículo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className={!vehicle.is_active ? "opacity-50" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingVehicle(vehicle);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{vehicle.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {vehicle.brand && (
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{vehicle.brand}</span>
                )}
                <span className={`text-xs px-2 py-1 rounded ${vehicle.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {vehicle.is_available ? "Disponible" : "No disponible"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle?.id ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={editingVehicle?.name || ""}
                onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={editingVehicle?.description || ""}
                onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Marca</label>
                <Input
                  value={editingVehicle?.brand || ""}
                  onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, brand: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Modelo</label>
                <Input
                  value={editingVehicle?.model || ""}
                  onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, model: e.target.value } : null)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categoría</label>
              <Input
                value={editingVehicle?.category || ""}
                onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, category: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Imagen</label>
              <ImageUpload
                value={editingVehicle?.image_url || ""}
                onChange={(url) => setEditingVehicle(prev => prev ? { ...prev, image_url: url } : null)}
                folder="vehicles"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingVehicle?.is_available || false}
                  onCheckedChange={(checked) => setEditingVehicle(prev => prev ? { ...prev, is_available: checked } : null)}
                />
                <label className="text-sm font-medium">Disponible</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingVehicle?.is_active || false}
                  onCheckedChange={(checked) => setEditingVehicle(prev => prev ? { ...prev, is_active: checked } : null)}
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

export default AdminVehicles;
