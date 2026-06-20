import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Navigation, FolderPlus } from "lucide-react";

interface NavigationLink {
  id: string;
  label: string;
  label_en: string | null;
  path: string;
  icon: string;
  location: string;
  title: string | null;
  title_en: string | null;
  sort_order: number;
  is_active: boolean;
}

const iconOptions = [
  "Home", "Users", "Building2", "Wrench", "Truck", "Settings",
  "Phone", "FolderKanban", "Briefcase", "Mail", "MapPin", "Award",
];

// Pre-defined locations (used as suggestions). Any string is allowed.
const PRESET_LOCATIONS: Record<string, string> = {
  navbar: "Navbar Principal",
  footer_services: "Footer - Servicios",
  footer_company: "Footer - Empresa",
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

const AdminNavigation = () => {
  const [links, setLinks] = useState<NavigationLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Create-group dialog state
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupLocation, setNewGroupLocation] = useState("");
  const [newGroupKind, setNewGroupKind] = useState<"footer" | "navbar" | "custom">("footer");

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

  // Group links by `location`, surface title from any row
  const groups = useMemo(() => {
    const map = new Map<string, { location: string; title: string; links: NavigationLink[] }>();
    links.forEach((link) => {
      const g = map.get(link.location);
      if (g) {
        g.links.push(link);
        if (!g.title && link.title) g.title = link.title;
      } else {
        map.set(link.location, {
          location: link.location,
          title: link.title || PRESET_LOCATIONS[link.location] || link.location,
          links: [link],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.location.localeCompare(b.location));
  }, [links]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const link of links) {
        const { error } = await supabase
          .from("navigation_links")
          .upsert({
            id: link.id,
            label: link.label,
            label_en: link.label_en,
            path: link.path,
            icon: link.icon,
            location: link.location,
            title: link.title,
            title_en: link.title_en,
            sort_order: link.sort_order,
            is_active: link.is_active,
          });
        if (error) throw error;
      }
      toast.success("Cambios guardados");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar los enlaces");
    }
    setIsSaving(false);
  };

  const addLinkToGroup = async (location: string, title: string) => {
    const existing = links.filter((l) => l.location === location);
    const newLink = {
      label: "Nuevo Enlace",
      path: "/",
      icon: "Home",
      location,
      title,
      sort_order: existing.length,
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
    const { error } = await supabase.from("navigation_links").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar el enlace");
      console.error(error);
    } else {
      setLinks(links.filter((link) => link.id !== id));
      toast.success("Enlace eliminado");
    }
  };

  const updateLink = (id: string, field: keyof NavigationLink, value: string | number | boolean | null) => {
    setLinks(links.map((link) => (link.id === id ? { ...link, [field]: value } : link)));
  };

  // Update title for every row of a group (in-memory; persisted on Save)
  const updateGroupTitle = (location: string, title: string) => {
    setLinks(links.map((link) => (link.location === location ? { ...link, title } : link)));
  };

  // Delete an entire group (all its links)
  const deleteGroup = async (location: string) => {
    if (!confirm(`¿Eliminar el grupo "${location}" y todos sus enlaces?`)) return;
    const { error } = await supabase.from("navigation_links").delete().eq("location", location);
    if (error) {
      toast.error("Error al eliminar el grupo");
      console.error(error);
    } else {
      setLinks(links.filter((link) => link.location !== location));
      toast.success("Grupo eliminado");
    }
  };

  const handleCreateGroup = async () => {
    const title = newGroupTitle.trim();
    if (!title) {
      toast.error("Ingresa un título para el grupo");
      return;
    }
    let location = newGroupLocation.trim() || slugify(title);
    if (newGroupKind === "footer" && !location.startsWith("footer_")) {
      location = `footer_${location.replace(/^footer_?/, "")}`;
    }
    if (newGroupKind === "navbar" && !location.startsWith("navbar")) {
      location = `navbar_${location.replace(/^navbar_?/, "")}`;
    }
    if (groups.some((g) => g.location === location)) {
      toast.error("Ya existe un grupo con esa clave");
      return;
    }

    // Create the group by inserting one placeholder link
    const { data, error } = await supabase
      .from("navigation_links")
      .insert({
        label: "Nuevo Enlace",
        path: "/",
        icon: "Home",
        location,
        title,
        sort_order: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear el grupo");
      console.error(error);
      return;
    }
    if (data) setLinks([...links, data]);
    toast.success("Grupo creado");
    setIsGroupDialogOpen(false);
    setNewGroupTitle("");
    setNewGroupLocation("");
    setNewGroupKind("footer");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6" />
            Navegación
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organiza enlaces por grupos. Cada grupo del footer se muestra como una columna.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                Nuevo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nuevo grupo de navegación</DialogTitle>
                <DialogDescription>
                  Los grupos del footer aparecen como columnas adicionales en el pie de página.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Tipo</Label>
                  <Select value={newGroupKind} onValueChange={(v) => setNewGroupKind(v as typeof newGroupKind)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="footer">Columna del Footer</SelectItem>
                      <SelectItem value="navbar">Sección del Navbar</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título visible</Label>
                  <Input
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    placeholder="Ej: Legal, Recursos, Soporte"
                  />
                </div>
                <div>
                  <Label>Clave interna (opcional)</Label>
                  <Input
                    value={newGroupLocation}
                    onChange={(e) => setNewGroupLocation(e.target.value)}
                    placeholder={`Auto: ${slugify(newGroupTitle) || "mi_grupo"}`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Solo letras minúsculas, números y guiones bajos. Si lo dejas vacío se genera del título.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateGroup}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay grupos de navegación. Crea uno con "Nuevo Grupo".
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.location}>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Título del grupo</Label>
                    <Input
                      value={group.title}
                      onChange={(e) => updateGroupTitle(group.location, e.target.value)}
                      className="font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Clave (location)</Label>
                    <Input value={group.location} disabled className="text-muted-foreground" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => addLinkToGroup(group.location, group.title)}>
                    <Plus className="h-4 w-4 mr-1" /> Enlace
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGroup(group.location)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.links.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sin enlaces en este grupo</p>
              ) : (
                group.links.map((link) => (
                  <div key={link.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                      <div>
                        <Label className="text-xs">Etiqueta</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => updateLink(link.id, "label", e.target.value)}
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
                          value={link.icon || "Home"}
                          onValueChange={(value) => updateLink(link.id, "icon", value)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((icon) => (
                              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
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
                    <div className="flex flex-col items-center gap-2 pt-5">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={(checked) => updateLink(link.id, "is_active", checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLink(link.id)}
                        className="text-destructive hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default AdminNavigation;
