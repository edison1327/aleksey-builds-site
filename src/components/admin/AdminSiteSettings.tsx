import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "./ImageUpload";
import { I18nField } from "./I18nField";

const AdminSiteSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  
  const [formData, setFormData] = useState({
    company_name: "",
    tagline: "",
    tagline_en: "",
    logo_url: "",
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
            Gestiona el logo y la información general del sitio web
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Logo de la Empresa</Label>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <ImageUpload
                    value={formData.logo_url}
                    onChange={(url) => setFormData({ ...formData, logo_url: url })}
                    folder="logos"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Sube el logo de tu empresa. Formato recomendado: PNG con fondo transparente.
                  </p>
                </div>
                
                {/* Preview */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Vista previa</Label>
                  <div className="space-y-4">
                    {/* Light background preview */}
                    <div className="bg-white border rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-2">Fondo claro:</p>
                      {formData.logo_url ? (
                        <img 
                          src={formData.logo_url} 
                          alt="Logo preview" 
                          className="h-12 object-contain"
                        />
                      ) : (
                        <div className="h-12 flex items-center">
                          <span className="text-xl font-bold text-gray-800">{formData.company_name}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Dark background preview */}
                    <div className="bg-secondary border rounded-lg p-4">
                      <p className="text-xs text-secondary-foreground/60 mb-2">Fondo oscuro (Footer):</p>
                      {formData.logo_url ? (
                        <img 
                          src={formData.logo_url} 
                          alt="Logo preview" 
                          className="h-12 object-contain brightness-0 invert"
                        />
                      ) : (
                        <div className="h-12 flex items-center">
                          <span className="text-xl font-bold text-white">{formData.company_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de la Empresa</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="ALEKSEY"
              />
            </div>

            {/* Tagline */}
            <I18nField
              label="Eslogan / Subtítulo"
              valueEs={formData.tagline}
              valueEn={formData.tagline_en}
              onChangeEs={(v) => setFormData({ ...formData, tagline: v })}
              onChangeEn={(v) => setFormData({ ...formData, tagline_en: v })}
              placeholderEs="Ingeniería y Construcción"
            />

            {/* Footer Description */}
            <I18nField
              label="Descripción del Footer"
              valueEs={formData.footer_description}
              valueEn={formData.footer_description_en}
              onChangeEs={(v) => setFormData({ ...formData, footer_description: v })}
              onChangeEn={(v) => setFormData({ ...formData, footer_description_en: v })}
              textarea
              rows={3}
              placeholderEs="Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada."
            />
            <p className="text-sm text-muted-foreground -mt-3">
              Este texto aparece debajo del logo en el footer del sitio.
            </p>

            {/* Footer Copyright */}
            <I18nField
              label="Texto de Copyright"
              valueEs={formData.footer_copyright}
              valueEn={formData.footer_copyright_en}
              onChangeEs={(v) => setFormData({ ...formData, footer_copyright: v })}
              onChangeEn={(v) => setFormData({ ...formData, footer_copyright_en: v })}
              placeholderEs="Todos los derechos reservados."
            />
            <p className="text-sm text-muted-foreground -mt-3">
              Aparece al final del footer junto con el año y nombre de la empresa.
            </p>


            <Button 
              type="submit" 
              disabled={updateSettings.isPending}
              className="gap-2"
            >
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSiteSettings;
