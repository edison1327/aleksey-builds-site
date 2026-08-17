import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, ImageIcon, Sun, Moon, Layout } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "./ImageUpload";

const AdminSiteSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  
  const [formData, setFormData] = useState({
    company_name: "",
    tagline: "",
    tagline_en: "",
    logo_url: "",
    logo_url_dark: "",
    footer_logo_url: "",
    footer_logo_url_dark: "",
    footer_description: "",
    footer_description_en: "",
    footer_copyright: "",
    footer_copyright_en: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || "",
        tagline: settings.tagline || "",
        tagline_en: settings.tagline_en || "",
        logo_url: settings.logo_url || "",
        logo_url_dark: settings.logo_url_dark || "",
        footer_logo_url: settings.footer_logo_url || "",
        footer_logo_url_dark: settings.footer_logo_url_dark || "",
        footer_description: settings.footer_description || "",
        footer_description_en: settings.footer_description_en || "",
        footer_copyright: settings.footer_copyright || "",
        footer_copyright_en: settings.footer_copyright_en || "",
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSettings.mutateAsync(formData);
      toast.success("Configuración actualizada correctamente");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Error al actualizar la configuración");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-xl">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Configuración del Sitio
          </CardTitle>
          <CardDescription>
            Gestiona los logos independientes y la información general del sitio
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Logos Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Layout className="h-5 w-5" /> Gestión de Logos Independientes
                </h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Navbar Logos */}
                <div className="space-y-6 p-6 border rounded-xl bg-muted/30 shadow-sm">
                  <h4 className="font-bold flex items-center gap-2 text-primary uppercase tracking-wider text-sm">
                    Logo del Menú Principal (Navbar)
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-orange-500" /> Modo Claro
                      </Label>
                      <ImageUpload
                        value={formData.logo_url}
                        onChange={(url) => setFormData({ ...formData, logo_url: url })}
                        folder="logos"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-blue-400" /> Modo Oscuro
                      </Label>
                      <ImageUpload
                        value={formData.logo_url_dark}
                        onChange={(url) => setFormData({ ...formData, logo_url_dark: url })}
                        folder="logos"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Logos */}
                <div className="space-y-6 p-4 border rounded-xl bg-muted/30">
                  <h4 className="font-medium flex items-center gap-2 text-primary">
                    Logo del Footer
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-orange-500" /> Modo Claro
                      </Label>
                      <ImageUpload
                        value={formData.footer_logo_url}
                        onChange={(url) => setFormData({ ...formData, footer_logo_url: url })}
                        folder="logos"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-blue-400" /> Modo Oscuro
                      </Label>
                      <ImageUpload
                        value={formData.footer_logo_url_dark}
                        onChange={(url) => setFormData({ ...formData, footer_logo_url_dark: url })}
                        folder="logos"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* General Info Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold border-b pb-2">Información General</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nombre de la Empresa</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="ALEKSEY"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Eslogan / Subtítulo</Label>
                  <Input
                    value={formData.tagline || ""}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción del Footer</Label>
                <Textarea
                  value={formData.footer_description || ""}
                  onChange={(e) => setFormData({ ...formData, footer_description: e.target.value })} 
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Texto de Copyright</Label>
                <Input
                  value={formData.footer_copyright || ""}
                  onChange={(e) => setFormData({ ...formData, footer_copyright: e.target.value })}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={updateSettings.isPending}
              className="w-full md:w-auto gap-2"
              size="lg"
            >
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar Configuración de Marca
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSiteSettings;