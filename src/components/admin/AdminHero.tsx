import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Play, Check, Upload, X, Video } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const VIDEO_OPTIONS = [
  {
    id: "construction-1",
    name: "Construcción Industrial",
    url: "https://videos.pexels.com/video-files/3194277/3194277-uhd_2560_1440_30fps.mp4",
    thumbnail: "https://images.pexels.com/videos/3194277/free-video-3194277.jpg?auto=compress&cs=tinysrgb&w=300"
  },
  {
    id: "construction-2", 
    name: "Grúa en Obra",
    url: "https://videos.pexels.com/video-files/2491284/2491284-uhd_2560_1440_24fps.mp4",
    thumbnail: "https://images.pexels.com/videos/2491284/free-video-2491284.jpg?auto=compress&cs=tinysrgb&w=300"
  },
  {
    id: "construction-3",
    name: "Trabajo en Altura",
    url: "https://videos.pexels.com/video-files/3255275/3255275-uhd_2560_1440_25fps.mp4",
    thumbnail: "https://images.pexels.com/videos/3255275/free-video-3255275.jpg?auto=compress&cs=tinysrgb&w=300"
  },
  {
    id: "construction-4",
    name: "Ciudad en Desarrollo",
    url: "https://videos.pexels.com/video-files/1721294/1721294-uhd_2560_1440_25fps.mp4",
    thumbnail: "https://images.pexels.com/videos/1721294/free-video-1721294.jpg?auto=compress&cs=tinysrgb&w=300"
  },
  {
    id: "construction-5",
    name: "Maquinaria Pesada",
    url: "https://videos.pexels.com/video-files/6077417/6077417-uhd_2560_1440_25fps.mp4",
    thumbnail: "https://images.pexels.com/videos/6077417/pexels-photo-6077417.jpeg?auto=compress&cs=tinysrgb&w=300"
  },
  {
    id: "custom",
    name: "URL Personalizada",
    url: "",
    thumbnail: ""
  }
];

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideos, setUploadedVideos] = useState<{ name: string; url: string; created_at: string }[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
    fetchUploadedVideos();
  }, []);

  const fetchUploadedVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const { data, error } = await supabase.storage
        .from('hero-videos')
        .list('', {
          limit: 20,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const videos = (data || [])
        .filter(file => file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov'))
        .map(file => {
          const { data: urlData } = supabase.storage
            .from('hero-videos')
            .getPublicUrl(file.name);
          return {
            name: file.name,
            url: urlData.publicUrl,
            created_at: file.created_at || ''
          };
        });

      setUploadedVideos(videos);
    } catch (error) {
      console.error("Error fetching uploaded videos:", error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

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

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de video válido.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "El video no puede superar los 100MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-video-${Date.now()}.${fileExt}`;

      // Simulate progress (Supabase doesn't provide upload progress natively)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('hero-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('hero-videos')
        .getPublicUrl(data.path);

      setContent(prev => prev ? { ...prev, video_url: urlData.publicUrl } : null);

      toast({
        title: "Video subido",
        description: "El video se ha subido correctamente.",
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Error",
        description: "No se pudo subir el video.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Video de Fondo</CardTitle>
            <CardDescription>Selecciona un video predefinido o ingresa una URL personalizada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {VIDEO_OPTIONS.map((video) => {
                const isSelected = video.id === "custom" 
                  ? !VIDEO_OPTIONS.slice(0, -1).some(v => v.url === content?.video_url)
                  : video.url === content?.video_url;
                
                return (
                  <div
                    key={video.id}
                    onClick={() => {
                      if (video.id !== "custom") {
                        setContent(prev => prev ? { ...prev, video_url: video.url } : null);
                      }
                    }}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {video.thumbnail ? (
                      <div className="aspect-video relative">
                        <img 
                          src={video.thumbnail} 
                          alt={video.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">URL Personalizada</span>
                      </div>
                    )}
                    <div className="p-2 bg-card">
                      <p className="text-sm font-medium truncate">{video.name}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Uploaded Videos Gallery */}
            {uploadedVideos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Videos subidos anteriormente</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchUploadedVideos}
                    disabled={isLoadingVideos}
                  >
                    {isLoadingVideos ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {uploadedVideos.map((video) => {
                    const isSelected = content?.video_url === video.url;
                    return (
                      <div
                        key={video.name}
                        onClick={() => setContent(prev => prev ? { ...prev, video_url: video.url } : null)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="aspect-video bg-muted relative">
                          <video
                            src={video.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="p-2 bg-card">
                          <p className="text-xs font-medium truncate" title={video.name}>
                            {video.name.replace(/^hero-video-\d+-?/, '').replace(/\.\w+$/, '') || 'Video subido'}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Upload Section */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={async (e) => {
                  await handleVideoUpload(e);
                  fetchUploadedVideos(); // Refresh gallery after upload
                }}
                className="hidden"
                id="video-upload"
              />
              
              {isUploading ? (
                <div className="space-y-4">
                  <Video className="h-12 w-12 mx-auto text-primary animate-pulse" />
                  <p className="text-sm text-muted-foreground">Subiendo video...</p>
                  <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                  <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                </div>
              ) : (
                <label htmlFor="video-upload" className="cursor-pointer block">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Subir nuevo video</p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, WebM o MOV (máx. 100MB)</p>
                </label>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O usa una URL</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">URL del video</label>
              <Input
                value={content?.video_url || ""}
                onChange={(e) => setContent(prev => prev ? { ...prev, video_url: e.target.value } : null)}
                placeholder="https://..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Selecciona un video predefinido, sube uno propio o pega una URL
              </p>
            </div>

            {content?.video_url && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Vista previa</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setContent(prev => prev ? { ...prev, video_url: VIDEO_OPTIONS[0].url } : null);
                      toast({
                        title: "Video restablecido",
                        description: "Se ha restaurado el video predeterminado.",
                      });
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Restablecer predeterminado
                  </Button>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted relative group">
                  <video
                    key={content.video_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src={content.video_url} type="video/mp4" />
                  </video>
                </div>
                {content.video_url === VIDEO_OPTIONS[0].url && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Check className="h-3 w-3 text-primary" />
                    Usando video predeterminado
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
            <CardDescription>Números destacados</CardDescription>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHero;
