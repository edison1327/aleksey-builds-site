import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Users, TrendingUp, Heart, Send, MapPin, Clock, DollarSign } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Crecimiento Profesional",
    description: "Oportunidades de desarrollo y capacitación continua para impulsar tu carrera."
  },
  {
    icon: Users,
    title: "Ambiente Colaborativo",
    description: "Trabaja con un equipo de profesionales apasionados y comprometidos."
  },
  {
    icon: Heart,
    title: "Beneficios Competitivos",
    description: "Seguro médico, bonos por desempeño y prestaciones superiores a la ley."
  },
  {
    icon: Briefcase,
    title: "Proyectos Desafiantes",
    description: "Participa en proyectos de gran envergadura que marcan la diferencia."
  },
];

const openPositions = [
  {
    title: "Ingeniero Civil Senior",
    department: "Ingeniería",
    location: "Ciudad Capital",
    type: "Tiempo Completo",
    salary: "Competitivo",
  },
  {
    title: "Arquitecto de Proyectos",
    department: "Diseño",
    location: "Ciudad Capital",
    type: "Tiempo Completo",
    salary: "Competitivo",
  },
  {
    title: "Supervisor de Obra",
    department: "Construcción",
    location: "Varias Ubicaciones",
    type: "Tiempo Completo",
    salary: "Competitivo",
  },
  {
    title: "Operador de Maquinaria Pesada",
    department: "Operaciones",
    location: "Varias Ubicaciones",
    type: "Tiempo Completo",
    salary: "A convenir",
  },
  {
    title: "Asistente Administrativo",
    department: "Administración",
    location: "Ciudad Capital",
    type: "Tiempo Completo",
    salary: "Competitivo",
  },
];

const CareersPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

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
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <benefit.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2 text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
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
          <div className="max-w-4xl mx-auto space-y-4">
            {openPositions.map((position, index) => (
              <div
                key={index}
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
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {position.salary}
                    </span>
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
                    {openPositions.map((pos, index) => (
                      <option key={index} value={pos.title}>
                        {pos.title}
                      </option>
                    ))}
                    <option value="Otra">Otra posición</option>
                  </select>
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
