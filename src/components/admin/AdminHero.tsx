import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

interface HeroContent {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  badge_text: string | null;
  projects_count: number | null;
  years_count: number | null;
  clients_percentage: number | null;
  video_url: string | null;
}

const AdminHero = () => {
  const [content, setContent] = useState<HeroContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("hero_content")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error fetching hero content:", error);
    } else if (data) {
      setContent(data);
    } else {
      // Create default content if none exists
      setContent({
        id: "",
        title: "ALEKSEY",
        subtitle: "INGENIERÍA Y CONSTRUCCIÓN",
        description: "Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada.",
        badge_text: "MÁS DE 10 AÑOS DE EXPERIENCIA",
        projects_count: 150,
        years_count: 10,
        clients_percentage: 98,
        video_url: "",
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!content) return;
    
    setIsSaving(true);
    
    try {
      if (content.id) {
        const { error } = await supabase
          .from("hero_content")
          .update({
            title: content.title,
            subtitle: content.subtitle,
            description: content.description,
            badge_text: content.badge_text,
            projects_count: content.projects_count,
            years_count: content.years_count,
            clients_percentage: content.clients_percentage,
            video_url: content.video_url,
          })
          .eq("id", content.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("hero_content")
          .insert({
            title: content.title,
            subtitle: content.subtitle,
            description: content.description,
            badge_text: content.badge_text,
            projects_count: content.projects_count,
            years_count: content.years_count,
            clients_percentage: content.clients_percentage,
            video_url: content.video_url,
          })
          .select()
          .single();

        if (error) throw error;
        setContent(data);
      }

      toast({
        title: "Guardado",
        description: "El contenido del hero se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error("Error saving hero content:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el contenido.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
          <h2 className="text-2xl font-heading font-bold">Sección Hero</h2>
          <p className="text-muted-foreground">Edita el contenido principal de la página de inicio</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Textos principales</CardTitle>
            <CardDescription>Título, subtítulo y descripción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={content?.title || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="ALEKSEY"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subtítulo</label>
              <Input
                value={content?.subtitle || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                placeholder="INGENIERÍA Y CONSTRUCCIÓN"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Badge</label>
              <Input
                value={content?.badge_text || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, badge_text: e.target.value } : null)}
                placeholder="MÁS DE 10 AÑOS DE EXPERIENCIA"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={content?.description || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Descripción del negocio..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas y Video</CardTitle>
            <CardDescription>Números y video de fondo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Proyectos completados</label>
              <Input
                type="number"
                value={content?.projects_count || 0}
                onChange={(e) => setContent(prev => prev ? { ...prev, projects_count: parseInt(e.target.value) || 0 } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Años de experiencia</label>
              <Input
                type="number"
                value={content?.years_count || 0}
                onChange={(e) => setContent(prev => prev ? { ...prev, years_count: parseInt(e.target.value) || 0 } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Porcentaje de satisfacción</label>
              <Input
                type="number"
                value={content?.clients_percentage || 0}
                onChange={(e) => setContent(prev => prev ? { ...prev, clients_percentage: parseInt(e.target.value) || 0 } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL del video de fondo</label>
              <Input
                value={content?.video_url || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, video_url: e.target.value } : null)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHero;
