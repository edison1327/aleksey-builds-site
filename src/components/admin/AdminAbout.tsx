import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Plus, X } from "lucide-react";

interface AboutContent {
  id: string;
  title: string;
  description: string | null;
  mission: string | null;
  vision: string | null;
  values: string[] | null;
  image_url: string | null;
}

const AdminAbout = () => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newValue, setNewValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("about_content")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error fetching about content:", error);
    } else if (data) {
      setContent(data);
    } else {
      setContent({
        id: "",
        title: "SOBRE ALEKSEY",
        description: "",
        mission: "",
        vision: "",
        values: [],
        image_url: "",
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
          .from("about_content")
          .update({
            title: content.title,
            description: content.description,
            mission: content.mission,
            vision: content.vision,
            values: content.values,
            image_url: content.image_url,
          })
          .eq("id", content.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("about_content")
          .insert({
            title: content.title,
            description: content.description,
            mission: content.mission,
            vision: content.vision,
            values: content.values,
            image_url: content.image_url,
          })
          .select()
          .single();

        if (error) throw error;
        setContent(data);
      }

      toast({
        title: "Guardado",
        description: "El contenido de About se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error("Error saving about content:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el contenido.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addValue = () => {
    if (!newValue.trim() || !content) return;
    setContent({
      ...content,
      values: [...(content.values || []), newValue.trim()],
    });
    setNewValue("");
  };

  const removeValue = (index: number) => {
    if (!content) return;
    const newValues = [...(content.values || [])];
    newValues.splice(index, 1);
    setContent({ ...content, values: newValues });
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
          <h2 className="text-2xl font-heading font-bold">Sección About</h2>
          <p className="text-muted-foreground">Edita la información de la empresa</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Título y descripción de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={content?.title || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="SOBRE ALEKSEY"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción / Historia</label>
              <Textarea
                value={content?.description || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Historia de la empresa..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usa doble salto de línea para separar párrafos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Misión y Visión</CardTitle>
            <CardDescription>Propósito y objetivos de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Misión</label>
              <Textarea
                value={content?.mission || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, mission: e.target.value } : null)}
                placeholder="La misión de la empresa..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Visión</label>
              <Textarea
                value={content?.vision || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, vision: e.target.value } : null)}
                placeholder="La visión de la empresa..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Valores</CardTitle>
            <CardDescription>Los valores fundamentales de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Agregar un valor..."
                onKeyDown={(e) => e.key === "Enter" && addValue()}
              />
              <Button onClick={addValue} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {content?.values?.map((value, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full"
                >
                  <span className="text-sm">{value}</span>
                  <button
                    onClick={() => removeValue(index)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAbout;
