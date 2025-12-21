import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Share2 } from "lucide-react";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

const platformOptions = [
  { value: "facebook", label: "Facebook", icon: "Facebook" },
  { value: "instagram", label: "Instagram", icon: "Instagram" },
  { value: "linkedin", label: "LinkedIn", icon: "Linkedin" },
  { value: "twitter", label: "Twitter/X", icon: "Twitter" },
  { value: "youtube", label: "YouTube", icon: "Youtube" },
  { value: "tiktok", label: "TikTok", icon: "Music" },
  { value: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
];

const AdminSocialLinks = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .order("sort_order");

    if (error) {
      toast.error("Error al cargar los enlaces sociales");
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
          .from("social_links")
          .upsert({
            id: link.id,
            platform: link.platform,
            url: link.url,
            icon: link.icon,
            sort_order: link.sort_order,
            is_active: link.is_active,
          });

        if (error) throw error;
      }
      toast.success("Enlaces sociales guardados correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar los enlaces sociales");
    }
    setIsSaving(false);
  };

  const addLink = async () => {
    const newLink = {
      platform: "facebook",
      url: "https://facebook.com/",
      icon: "Facebook",
      sort_order: links.length,
      is_active: true,
    };

    const { data, error } = await supabase
      .from("social_links")
      .insert(newLink)
      .select()
      .single();

    if (error) {
      toast.error("Error al crear el enlace social");
      console.error(error);
    } else if (data) {
      setLinks([...links, data]);
      toast.success("Enlace social creado");
    }
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase
      .from("social_links")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar el enlace social");
      console.error(error);
    } else {
      setLinks(links.filter((link) => link.id !== id));
      toast.success("Enlace social eliminado");
    }
  };

  const updateLink = (id: string, field: keyof SocialLink, value: string | number | boolean | null) => {
    setLinks(links.map((link) => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const handlePlatformChange = (id: string, platform: string) => {
    const platformInfo = platformOptions.find(p => p.value === platform);
    setLinks(links.map((link) => 
      link.id === id ? { ...link, platform, icon: platformInfo?.icon || "Share2" } : link
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
          <Share2 className="h-6 w-6" />
          Redes Sociales
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addLink}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Red Social
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enlaces de Redes Sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {links.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay redes sociales configuradas</p>
          ) : (
            links.map((link) => (
              <div key={link.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div>
                    <Label className="text-xs">Plataforma</Label>
                    <Select
                      value={link.platform}
                      onValueChange={(value) => handlePlatformChange(link.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platformOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label className="text-xs">URL</Label>
                    <Input
                      value={link.url}
                      onChange={(e) => updateLink(link.id, "url", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={link.is_active ?? true}
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
    </div>
  );
};

export default AdminSocialLinks;