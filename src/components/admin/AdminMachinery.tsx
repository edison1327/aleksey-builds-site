import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, GripHorizontal, Copy } from "lucide-react";
import { duplicateRow } from "@/lib/duplicateRow";
import ImageUpload from "./ImageUpload";
import { SortableGrid } from "./SortableGrid";
import { logAction } from "@/lib/auditLog";

interface Machinery {
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

const AdminMachinery = () => {
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMachine, setEditingMachine] = useState<Machinery | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMachinery();
  }, []);

  const fetchMachinery = async () => {
    const { data, error } = await supabase
      .from("machinery")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching machinery:", error);
    } else {
      setMachinery(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!editingMachine) return;

    try {
      if (editingMachine.id) {
        const { error } = await supabase
          .from("machinery")
          .update({
            name: editingMachine.name,
            name_en: editingMachine.name_en,
            description: editingMachine.description,
            description_en: editingMachine.description_en,
            category: editingMachine.category,
            category_en: editingMachine.category_en,
            brand: editingMachine.brand,
            model: editingMachine.model,
            price: editingMachine.price,
            daily_rate: editingMachine.daily_rate,
            image_url: editingMachine.image_url,
            is_available: editingMachine.is_available,
            is_active: editingMachine.is_active,
            sort_order: editingMachine.sort_order,
          })
          .eq("id", editingMachine.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("machinery")
          .insert({
            name: editingMachine.name,
            name_en: editingMachine.name_en,
            description: editingMachine.description,
            description_en: editingMachine.description_en,
            category: editingMachine.category,
            category_en: editingMachine.category_en,
            brand: editingMachine.brand,
            model: editingMachine.model,
            price: editingMachine.price,
            daily_rate: editingMachine.daily_rate,
            image_url: editingMachine.image_url,
            is_available: editingMachine.is_available,
            is_active: editingMachine.is_active,
            sort_order: machinery.length,
          });

        if (error) throw error;
      }

      toast({ title: "Guardado", description: "Maquinaria actualizada correctamente." });
      logAction(editingMachine.id ? "update" : "create", "machinery", editingMachine.id || undefined, { name: editingMachine.name });
      setIsDialogOpen(false);
      setEditingMachine(null);
      fetchMachinery();
    } catch (error) {
      console.error("Error saving machinery:", error);
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta maquinaria?")) return;

    try {
      const { error } = await supabase.from("machinery").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "Maquinaria eliminada correctamente." });
      logAction("delete", "machinery", id);
      fetchMachinery();
    } catch (error) {
      console.error("Error deleting machinery:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleDuplicate = async (machine: any) => {
    try {
      const copy = await duplicateRow<any>("machinery", machine.id, {
        overrides: {
          name: `${machine.name} (copia)`,
          is_active: false,
          sort_order: machinery.length,
        },
      });
      toast({ title: "Duplicado", description: "Se creó una copia (inactiva)." });
      logAction("duplicate", "machinery", copy.id);
      fetchMachinery();
    } catch (e) {
      console.error("Error duplicating machinery:", e);
      toast({ title: "Error", description: "No se pudo duplicar.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (machine: any, next: boolean) => {
    setMachinery((prev) => prev.map((m: any) => (m.id === machine.id ? { ...m, is_active: next } : m)));
    const { error } = await supabase.from("machinery").update({ is_active: next }).eq("id", machine.id);
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
      setMachinery((prev) => prev.map((m: any) => (m.id === machine.id ? { ...m, is_active: !next } : m)));
      return;
    }
    logAction("update", "machinery", machine.id, { is_active: next });
  };


  const handleReorder = async (newOrder: typeof machinery) => {
    setMachinery(newOrder); // optimistic
    const updates = newOrder.map((m, idx) => ({ id: m.id, sort_order: idx }));
    try {
      await Promise.all(
        updates.map((u) => supabase.from("machinery").update({ sort_order: u.sort_order }).eq("id", u.id)),
      );
      logAction("reorder", "machinery", null, { count: updates.length });
      toast({ title: "Orden actualizado", description: "El nuevo orden se guardó." });
    } catch (err) {
      console.error("Error reordering:", err);
      toast({ title: "Error", description: "No se pudo guardar el orden.", variant: "destructive" });
      fetchMachinery();
    }
  };

  const openNewDialog = () => {
    setEditingMachine({
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
      sort_order: machinery.length,
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
          <h2 className="text-2xl font-heading font-bold">Maquinaria</h2>
          <p className="text-muted-foreground">Administra el catálogo de maquinaria</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva maquinaria
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-md">
        <GripHorizontal className="h-4 w-4" />
        Arrastra desde el ícono de la esquina superior izquierda para reordenar las tarjetas.
      </div>

      <SortableGrid
        items={machinery}
        onReorder={handleReorder}
        renderItem={(machine) => (
          <Card className={!machine.is_active ? "opacity-50" : ""}>
            <CardHeader className="pb-2 pl-12">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{machine.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingMachine(machine); setIsDialogOpen(true); }} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDuplicate(machine)} title="Duplicar">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(machine.id)} title="Eliminar">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{machine.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {machine.brand && (
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{machine.brand}</span>
                )}
                <span className={`text-xs px-2 py-1 rounded ${machine.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {machine.is_available ? "Disponible" : "No disponible"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMachine?.id ? "Editar maquinaria" : "Nueva maquinaria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Nombre (ES)</label>
                <Input
                  value={editingMachine?.name || ""}
                  onChange={(e) => setEditingMachine(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Name (EN)</label>
                <Input
                  value={editingMachine?.name_en || ""}
                  onChange={(e) => setEditingMachine(prev => prev ? { ...prev, name_en: e.target.value } : null)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Descripción (ES)</label>
                <Textarea
                  value={editingMachine?.description || ""}
                  onChange={(e) => setEditingMachine(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (EN)</label>
                <Textarea
                  value={editingMachine?.description_en || ""}
                  onChange={(e) => setEditingMachine(prev => prev ? { ...prev, description_en: e.target.value } : null)}
                  rows={3}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Marca</label>
                <Input
                  value={editingMachine?.brand || ""}
                  onChange={(e) => setEditingMachine(prev => prev ? { ...prev, brand: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Modelo</label>
                <Input
                  value={editingMachine?.model || ""}
                  onChange={(e) => setEditingMachine(prev => prev ? { ...prev, model: e.target.value } : null)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categoría</label>
              <Input
                value={editingMachine?.category || ""}
                onChange={(e) => setEditingMachine(prev => prev ? { ...prev, category: e.target.value } : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Precio mostrado (texto)</label>
                <Input
                  value={editingMachine?.price || ""}
                  onChange={(e) => setEditingMachine(prev => prev ? { ...prev, price: e.target.value } : null)}
                  placeholder="S/ 500/día"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tarifa diaria (PEN)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingMachine?.daily_rate ?? ""}
                  onChange={(e) => setEditingMachine(prev => prev ? { ...prev, daily_rate: e.target.value ? Number(e.target.value) : null } : null)}
                  placeholder="500.00"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Para la calculadora del cotizador.</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Imagen</label>
              <ImageUpload
                value={editingMachine?.image_url || ""}
                onChange={(url) => setEditingMachine(prev => prev ? { ...prev, image_url: url } : null)}
                folder="machinery"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingMachine?.is_available || false}
                  onCheckedChange={(checked) => setEditingMachine(prev => prev ? { ...prev, is_available: checked } : null)}
                />
                <label className="text-sm font-medium">Disponible</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingMachine?.is_active || false}
                  onCheckedChange={(checked) => setEditingMachine(prev => prev ? { ...prev, is_active: checked } : null)}
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

export default AdminMachinery;
