import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, GripVertical, Navigation } from "lucide-react";

interface NavigationLink {
  id: string;
  label: string;
  path: string;
  icon: string;
  location: string;
  sort_order: number;
  is_active: boolean;
}

const iconOptions = [
  "Home", "Users", "Building2", "Wrench", "Truck", "Settings", 
  "Phone", "FolderKanban", "Briefcase", "Mail", "MapPin", "Award"
];

const locationOptions = [
  { value: "navbar", label: "Navbar Principal" },
  { value: "footer_services", label: "Footer - Servicios" },
  { value: "footer_company", label: "Footer - Empresa" },
];

const AdminNavigation = () => {
  const [links, setLinks] = useState<NavigationLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("navigation_links")
      .select("*")
      .order("location")
      .order("sort_order");

    if (error) {
      toast.error("Error al cargar los enlaces");
      console.error(error);
    } else {
      setLinks(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const link of links) {
        const { error } = await supabase
          .from("navigation_links")
          .upsert({
            id: link.id,
            label: link.label,
            path: link.path,
            icon: link.icon,
            location: link.location,
            sort_order: link.sort_order,
            is_active: link.is_active,
          });

        if (error) throw error;
      }
      toast.success("Enlaces guardados correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar los enlaces");
    }
    setIsSaving(false);
  };

  const addLink = async () => {
    const newLink = {
      label: "Nuevo Enlace",
      path: "/",
      icon: "Home",
      location: "navbar",
      sort_order: links.length,
      is_active: true,
    };

    const { data, error } = await supabase
      .from("navigation_links")
      .insert(newLink)
      .select()
      .single();

    if (error) {
      toast.error("Error al crear el enlace");
      console.error(error);
    } else if (data) {
      setLinks([...links, data]);
      toast.success("Enlace creado");
    }
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase
      .from("navigation_links")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar el enlace");
      console.error(error);
    } else {
      setLinks(links.filter((link) => link.id !== id));
      toast.success("Enlace eliminado");
    }
  };

  const updateLink = (id: string, field: keyof NavigationLink, value: string | number | boolean) => {
    setLinks(links.map((link) => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedLinks = {
    navbar: links.filter(l => l.location === "navbar"),
    footer_services: links.filter(l => l.location === "footer_services"),
    footer_company: links.filter(l => l.location === "footer_company"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Navigation className="h-6 w-6" />
          Navegación
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addLink}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Enlace
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {locationOptions.map((loc) => (
        <Card key={loc.value}>
          <CardHeader>
            <CardTitle className="text-lg">{loc.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedLinks[loc.value as keyof typeof groupedLinks].length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay enlaces en esta sección</p>
            ) : (
              groupedLinks[loc.value as keyof typeof groupedLinks].map((link) => (
                <div key={link.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
                    <div>
                      <Label className="text-xs">Etiqueta</Label>
                      <Input
                        value={link.label}
                        onChange={(e) => updateLink(link.id, "label", e.target.value)}
                        placeholder="Etiqueta"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Ruta</Label>
                      <Input
                        value={link.path}
                        onChange={(e) => updateLink(link.id, "path", e.target.value)}
                        placeholder="/ruta"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Icono</Label>
                      <Select
                        value={link.icon}
                        onValueChange={(value) => updateLink(link.id, "icon", value)}
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
                      <Label className="text-xs">Ubicación</Label>
                      <Select
                        value={link.location}
                        onValueChange={(value) => updateLink(link.id, "location", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {locationOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Orden</Label>
                      <Input
                        type="number"
                        value={link.sort_order}
                        onChange={(e) => updateLink(link.id, "sort_order", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={link.is_active}
                      onCheckedChange={(checked) => updateLink(link.id, "is_active", checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLink(link.id)}
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
      ))}
    </div>
  );
};

export default AdminNavigation;