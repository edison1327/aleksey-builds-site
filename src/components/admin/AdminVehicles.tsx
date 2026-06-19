import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, GripHorizontal } from "lucide-react";
import ImageUpload from "./ImageUpload";
import { SortableGrid } from "./SortableGrid";
import { logAction } from "@/lib/auditLog";

interface Vehicle {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  category: string | null;
  category_en: string | null;
  brand: string | null;
  model: string | null;
  price: string | null;
  daily_rate: number | null;
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
            name_en: editingVehicle.name_en,
            description: editingVehicle.description,
            description_en: editingVehicle.description_en,
            category: editingVehicle.category,
            category_en: editingVehicle.category_en,
            brand: editingVehicle.brand,
            model: editingVehicle.model,
            price: editingVehicle.price,
            daily_rate: editingVehicle.daily_rate,
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
            name_en: editingVehicle.name_en,
            description: editingVehicle.description,
            description_en: editingVehicle.description_en,
            category: editingVehicle.category,
            category_en: editingVehicle.category_en,
            brand: editingVehicle.brand,
            model: editingVehicle.model,
            price: editingVehicle.price,
            daily_rate: editingVehicle.daily_rate,
            image_url: editingVehicle.image_url,
            is_available: editingVehicle.is_available,
            is_active: editingVehicle.is_active,
            sort_order: vehicles.length,
          });

        if (error) throw error;
      }

      toast({ title: "Guardado", description: "Vehículo actualizado correctamente." });
      logAction(editingVehicle.id ? "update" : "create", "vehicles", editingVehicle.id || undefined, { name: editingVehicle.name });
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
      logAction("delete", "vehicles", id);
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleReorder = async (newOrder: Vehicle[]) => {
    setVehicles(newOrder);
    try {
      await Promise.all(
        newOrder.map((v, idx) => supabase.from("vehicles").update({ sort_order: idx }).eq("id", v.id)),
      );
      logAction("reorder", "vehicles", null, { count: newOrder.length });
      toast({ title: "Orden actualizado" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo guardar el orden.", variant: "destructive" });
      fetchVehicles();
    }
  };

  const openNewDialog = () => {
    setEditingVehicle({
      id: "",
      name: "",
      name_en: "",
      description: "",
      description_en: "",
      category: "",
      category_en: "",
      brand: "",
      model: "",
      price: "",
      daily_rate: null,
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

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-md">
        <GripHorizontal className="h-4 w-4" />
        Arrastra desde el ícono de la esquina superior izquierda para reordenar.
      </div>

      <SortableGrid
        items={vehicles}
        onReorder={handleReorder}
        renderItem={(vehicle) => (
          <Card className={!vehicle.is_active ? "opacity-50" : ""}>
            <CardHeader className="pb-2 pl-12">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingVehicle(vehicle); setIsDialogOpen(true); }}>
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
        )}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle?.id ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Nombre (ES)</label>
                <Input
                  value={editingVehicle?.name || ""}
                  onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Name (EN)</label>
                <Input
                  value={editingVehicle?.name_en || ""}
                  onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, name_en: e.target.value } : null)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Descripción (ES)</label>
                <Textarea
                  value={editingVehicle?.description || ""}
                  onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (EN)</label>
                <Textarea
                  value={editingVehicle?.description_en || ""}
                  onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, description_en: e.target.value } : null)}
                  rows={3}
                  placeholder="Optional"
                />
              </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Precio mostrado (texto)</label>
                <Input
                  value={editingVehicle?.price || ""}
                  onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, price: e.target.value } : null)}
                  placeholder="S/ 300/día"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tarifa diaria (PEN)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingVehicle?.daily_rate ?? ""}
                  onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, daily_rate: e.target.value ? Number(e.target.value) : null } : null)}
                  placeholder="300.00"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Para la calculadora del cotizador.</p>
              </div>
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
