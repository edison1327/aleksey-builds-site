import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import { Briefcase, MapPin, Clock, DollarSign, Send, Loader2, Upload, FileText, X } from "lucide-react";

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string | null;
  description: string | null;
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const CareersPage = () => {
  const { toast } = useToast();
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    message: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const [positionsRes, benefitsRes] = await Promise.all([
        supabase
          .from('job_positions')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('company_benefits')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      ]);

      if (positionsRes.data) setPositions(positionsRes.data);
      if (benefitsRes.data) setBenefits(benefitsRes.data);
      
      setIsLoading(false);
    };

    fetchData();
  }, []);

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
    };
    return icons[iconName] || LucideIcons.Star;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Formato no válido",
          description: "Por favor, sube un archivo PDF o Word (.doc, .docx)",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo debe ser menor a 5MB",
          variant: "destructive",
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let resumeUrl: string | null = null;

      // Upload resume if provided
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Date.now()}-${formData.name.replace(/\s+/g, '-')}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile);

        if (uploadError) {
          console.error('Error uploading resume:', uploadError);
          toast({
            title: "Error",
            description: "No se pudo subir el CV. Por favor, intenta de nuevo.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        resumeUrl = fileName;
      }

      const { error } = await supabase
        .from('job_applications')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          position: formData.position,
          message: formData.message.trim() || null,
          resume_url: resumeUrl,
        });

      if (error) {
        console.error('Error submitting application:', error);
        toast({
          title: "Error",
          description: "Hubo un problema al enviar tu solicitud. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "¡Solicitud enviada!",
        description: "Hemos recibido tu información. Nos pondremos en contacto contigo pronto.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        position: "",
        message: "",
      });
      setResumeFile(null);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu solicitud. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 tracking-wide text-secondary-foreground">
              TRABAJA CON NOSOTROS
            </h1>
            <p className="text-xl text-secondary-foreground/80 leading-relaxed">
              Únete a nuestro equipo y forma parte de los proyectos más importantes del país.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12 text-foreground">
            ¿Por qué trabajar en ALEKSEY?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => {
              const IconComponent = getIcon(benefit.icon);
              return (
                <div
                  key={benefit.id}
                  className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2 text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4 text-foreground">
            Vacantes Disponibles
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Explora nuestras oportunidades laborales actuales y encuentra la posición ideal para ti.
          </p>
          
          {positions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No hay vacantes disponibles en este momento. ¡Vuelve pronto!
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                      {position.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {position.type}
                      </span>
                      {position.salary && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {position.salary}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setFormData({ ...formData, position: position.title });
                      document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading"
                  >
                    Aplicar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Application Form */}
      <section id="application-form" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4 text-foreground">
              Envía tu Solicitud
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Completa el formulario y nos pondremos en contacto contigo.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    required
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+58 XXX XXX XXXX"
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Posición de Interés *</Label>
                  <select
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecciona una posición</option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.title}>
                        {pos.title}
                      </option>
                    ))}
                    <option value="Otra">Otra posición</option>
                  </select>
                </div>
              </div>

              {/* Resume Upload */}
              <div className="space-y-2">
                <Label htmlFor="resume">Currículum / CV</Label>
                <div className="relative">
                  {resumeFile ? (
                    <div className="flex items-center gap-3 p-3 bg-background rounded-md border border-input">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm flex-1 truncate">{resumeFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="resume"
                      className="flex items-center justify-center gap-2 p-4 bg-background rounded-md border border-dashed border-input cursor-pointer hover:border-primary transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Subir CV (PDF o Word, máx. 5MB)
                      </span>
                    </label>
                  )}
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje / Experiencia</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Cuéntanos sobre tu experiencia y por qué te gustaría trabajar con nosotros..."
                  rows={5}
                  className="bg-background resize-none"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                * Campos obligatorios. Al enviar este formulario, aceptas que procesemos tu información para fines de reclutamiento.
              </p>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading text-lg py-6"
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    Enviar Solicitud
                    <Send className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default CareersPage;
