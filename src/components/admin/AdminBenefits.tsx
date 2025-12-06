import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Heart } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

const emptyBenefit: Omit<Benefit, "id"> & { id: string } = {
  id: "",
  title: "",
  description: "",
  icon: "Star",
  is_active: true,
  sort_order: 0,
};

const iconOptions = [
  "DollarSign", "GraduationCap", "Shield", "TrendingUp", "Users", 
  "Building2", "Heart", "Briefcase", "Star", "Award", "Clock",
  "Home", "Zap", "Coffee", "Globe", "Gift"
];

const AdminBenefits = () => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async () => {
    const { data, error } = await supabase
      .from("company_benefits")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching benefits:", error);
    } else {
      setBenefits(data || []);
    }
    setIsLoading(false);
  };

  const getIcon = (iconName: string): React.ComponentType<{ className?: string }> => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      DollarSign: LucideIcons.DollarSign,
      GraduationCap: LucideIcons.GraduationCap,
      Shield: LucideIcons.Shield,
      TrendingUp: LucideIcons.TrendingUp,
      Users: LucideIcons.Users,
      Building2: LucideIcons.Building2,
      Heart: LucideIcons.Heart,
      Briefcase: LucideIcons.Briefcase,
      Star: LucideIcons.Star,
      Award: LucideIcons.Award,
      Clock: LucideIcons.Clock,
      Home: LucideIcons.Home,
      Zap: LucideIcons.Zap,
      Coffee: LucideIcons.Coffee,
      Globe: LucideIcons.Globe,
      Gift: LucideIcons.Gift,
    };
    return icons[iconName] || LucideIcons.Star;
  };

  const handleSave = async () => {
    if (!editingBenefit) return;

    try {
      if (editingBenefit.id) {
        const { error } = await supabase
          .from("company_benefits")
          .update({
            title: editingBenefit.title,
            description: editingBenefit.description,
            icon: editingBenefit.icon,
            is_active: editingBenefit.is_active,
            sort_order: editingBenefit.sort_order,
          })
          .eq("id", editingBenefit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_benefits")
          .insert({
            title: editingBenefit.title,
            description: editingBenefit.description,
            icon: editingBenefit.icon,
            is_active: editingBenefit.is_active,
            sort_order: benefits.length,
          });

        if (error) throw error;
      }

      toast({ title: "Guardado", description: "Beneficio actualizado correctamente." });
      setIsDialogOpen(false);
      setEditingBenefit(null);
      fetchBenefits();
    } catch (error) {
      console.error("Error saving benefit:", error);
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este beneficio?")) return;

    try {
      const { error } = await supabase.from("company_benefits").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "Beneficio eliminado correctamente." });
      fetchBenefits();
    } catch (error) {
      console.error("Error deleting benefit:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("company_benefits")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      fetchBenefits();
    } catch (error) {
      console.error("Error toggling benefit:", error);
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
          <h2 className="text-2xl font-heading font-bold">Beneficios</h2>
          <p className="text-muted-foreground">Gestiona los beneficios de la empresa</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingBenefit(emptyBenefit)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Beneficio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingBenefit?.id ? "Editar Beneficio" : "Nuevo Beneficio"}
              </DialogTitle>
            </DialogHeader>
            {editingBenefit && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={editingBenefit.title}
                    onChange={(e) =>
                      setEditingBenefit({ ...editingBenefit, title: e.target.value })
                    }
                    placeholder="Ej: Salario Competitivo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    value={editingBenefit.description}
                    onChange={(e) =>
                      setEditingBenefit({ ...editingBenefit, description: e.target.value })
                    }
                    placeholder="Descripción del beneficio..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icono</Label>
                  <Select
                    value={editingBenefit.icon}
                    onValueChange={(value) =>
                      setEditingBenefit({ ...editingBenefit, icon: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((iconName) => {
                        const IconComponent = getIcon(iconName);
                        return (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {iconName}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingBenefit.is_active}
                    onCheckedChange={(checked) =>
                      setEditingBenefit({ ...editingBenefit, is_active: checked })
                    }
                  />
                  <Label>Activo</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!editingBenefit.title || !editingBenefit.description}>
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {benefits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay beneficios aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit) => {
            const IconComponent = getIcon(benefit.icon);
            return (
              <Card key={benefit.id} className={!benefit.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{benefit.title}</CardTitle>
                    </div>
                    <Switch
                      checked={benefit.is_active}
                      onCheckedChange={(checked) => handleToggleActive(benefit.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {benefit.description}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingBenefit(benefit);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(benefit.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminBenefits;
