import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, BarChart3 } from "lucide-react";

interface TeamStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const iconOptions = [
  "Users", "Wrench", "Building2", "Award", "Clock", "CheckCircle",
  "Briefcase", "HardHat", "Truck", "Settings", "Target", "TrendingUp"
];

const AdminTeamStats = () => {
  const [stats, setStats] = useState<TeamStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("team_stats")
      .select("*")
      .order("sort_order");

    if (error) {
      toast.error("Error al cargar las estadísticas");
      console.error(error);
    } else {
      setStats(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const stat of stats) {
        const { error } = await supabase
          .from("team_stats")
          .upsert({
            id: stat.id,
            label: stat.label,
            value: stat.value,
            icon: stat.icon,
            sort_order: stat.sort_order,
            is_active: stat.is_active,
          });

        if (error) throw error;
      }
      toast.success("Estadísticas guardadas correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar las estadísticas");
    }
    setIsSaving(false);
  };

  const addStat = async () => {
    const newStat = {
      label: "Nueva Estadística",
      value: "0",
      icon: "Users",
      sort_order: stats.length,
      is_active: true,
    };

    const { data, error } = await supabase
      .from("team_stats")
      .insert(newStat)
      .select()
      .single();

    if (error) {
      toast.error("Error al crear la estadística");
      console.error(error);
    } else if (data) {
      setStats([...stats, data]);
      toast.success("Estadística creada");
    }
  };

  const deleteStat = async (id: string) => {
    const { error } = await supabase
      .from("team_stats")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar la estadística");
      console.error(error);
    } else {
      setStats(stats.filter((stat) => stat.id !== id));
      toast.success("Estadística eliminada");
    }
  };

  const updateStat = (id: string, field: keyof TeamStat, value: string | number | boolean) => {
    setStats(stats.map((stat) => 
      stat.id === id ? { ...stat, [field]: value } : stat
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Estadísticas del Equipo
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addStat}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Estadística
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estadísticas (Ingenieros, Técnicos, etc.)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay estadísticas configuradas</p>
          ) : (
            stats.map((stat) => (
              <div key={stat.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                  <div>
                    <Label className="text-xs">Etiqueta</Label>
                    <Input
                      value={stat.label}
                      onChange={(e) => updateStat(stat.id, "label", e.target.value)}
                      placeholder="Ej: Ingenieros"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Valor</Label>
                    <Input
                      value={stat.value}
                      onChange={(e) => updateStat(stat.id, "value", e.target.value)}
                      placeholder="Ej: 25+"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Icono</Label>
                    <Select
                      value={stat.icon}
                      onValueChange={(value) => updateStat(stat.id, "icon", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Orden</Label>
                    <Input
                      type="number"
                      value={stat.sort_order}
                      onChange={(e) => updateStat(stat.id, "sort_order", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={stat.is_active}
                    onCheckedChange={(checked) => updateStat(stat.id, "is_active", checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteStat(stat.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamStats;