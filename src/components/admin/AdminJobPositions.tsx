import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Briefcase } from "lucide-react";

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyPosition: Omit<JobPosition, "id"> & { id: string } = {
  id: "",
  title: "",
  department: "",
  location: "",
  type: "Tiempo completo",
  salary: "",
  description: "",
  is_active: true,
  sort_order: 0,
};

const AdminJobPositions = () => {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    const { data, error } = await supabase
      .from("job_positions")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching positions:", error);
    } else {
      setPositions(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!editingPosition) return;

    try {
      if (editingPosition.id) {
        const { error } = await supabase
          .from("job_positions")
          .update({
            title: editingPosition.title,
            department: editingPosition.department,
            location: editingPosition.location,
            type: editingPosition.type,
            salary: editingPosition.salary || null,
            description: editingPosition.description || null,
            is_active: editingPosition.is_active,
            sort_order: editingPosition.sort_order,
          })
          .eq("id", editingPosition.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("job_positions")
          .insert({
            title: editingPosition.title,
            department: editingPosition.department,
            location: editingPosition.location,
            type: editingPosition.type,
            salary: editingPosition.salary || null,
            description: editingPosition.description || null,
            is_active: editingPosition.is_active,
            sort_order: positions.length,
          });

        if (error) throw error;
      }

      toast({ title: "Guardado", description: "Vacante actualizada correctamente." });
      setIsDialogOpen(false);
      setEditingPosition(null);
      fetchPositions();
    } catch (error) {
      console.error("Error saving position:", error);
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta vacante?")) return;

    try {
      const { error } = await supabase.from("job_positions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "Vacante eliminada correctamente." });
      fetchPositions();
    } catch (error) {
      console.error("Error deleting position:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("job_positions")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      fetchPositions();
    } catch (error) {
      console.error("Error toggling position:", error);
    }
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
          <h2 className="text-2xl font-heading font-bold">Vacantes</h2>
          <p className="text-muted-foreground">Gestiona las posiciones abiertas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingPosition(emptyPosition)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Vacante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPosition?.id ? "Editar Vacante" : "Nueva Vacante"}
              </DialogTitle>
            </DialogHeader>
            {editingPosition && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título del Puesto *</Label>
                  <Input
                    value={editingPosition.title}
                    onChange={(e) =>
                      setEditingPosition({ ...editingPosition, title: e.target.value })
                    }
                    placeholder="Ej: Ingeniero Civil Senior"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Departamento *</Label>
                    <Input
                      value={editingPosition.department}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, department: e.target.value })
                      }
                      placeholder="Ej: Ingeniería"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Input
                      value={editingPosition.location}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, location: e.target.value })
                      }
                      placeholder="Ej: Lima, Perú"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Empleo</Label>
                    <Input
                      value={editingPosition.type}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, type: e.target.value })
                      }
                      placeholder="Ej: Tiempo completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Salario</Label>
                    <Input
                      value={editingPosition.salary || ""}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, salary: e.target.value })
                      }
                      placeholder="Ej: S/. 5,000 - 7,000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={editingPosition.description || ""}
                    onChange={(e) =>
                      setEditingPosition({ ...editingPosition, description: e.target.value })
                    }
                    placeholder="Descripción del puesto..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPosition.is_active}
                    onCheckedChange={(checked) =>
                      setEditingPosition({ ...editingPosition, is_active: checked })
                    }
                  />
                  <Label>Activo</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!editingPosition.title || !editingPosition.department || !editingPosition.location}>
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {positions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay vacantes aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => (
            <Card key={position.id} className={!position.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{position.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {position.department} • {position.location} • {position.type}
                      {position.salary && ` • ${position.salary}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={position.is_active}
                      onCheckedChange={(checked) => handleToggleActive(position.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingPosition(position);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(position.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {position.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">{position.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminJobPositions;
