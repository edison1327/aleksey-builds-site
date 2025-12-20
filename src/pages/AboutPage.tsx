import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Award, Users, Clock, CheckCircle, Target, Eye, Heart } from "lucide-react";
import { useAboutContent, useHeroContent } from "@/hooks/useSiteData";
import { Skeleton } from "@/components/ui/skeleton";

const AboutPage = () => {
  const { data: aboutData, isLoading: aboutLoading } = useAboutContent();
  const { data: heroData, isLoading: heroLoading } = useHeroContent();

  const isLoading = aboutLoading || heroLoading;

  const stats = [
    { icon: Award, value: `${heroData?.years_count || 10}+`, label: "Años de Experiencia" },
    { icon: Users, value: `${heroData?.projects_count || 500}+`, label: "Proyectos Completados" },
    { icon: Clock, value: "100%", label: "Entregas a Tiempo" },
    { icon: CheckCircle, value: `${heroData?.clients_percentage || 98}%`, label: "Clientes Satisfechos" },
  ];

  const defaultValues = [
    {
      icon: Target,
      title: "Misión",
      description: "Brindar soluciones integrales de ingeniería y construcción con los más altos estándares de calidad, seguridad y eficiencia, superando las expectativas de nuestros clientes."
    },
    {
      icon: Eye,
      title: "Visión",
      description: "Ser la empresa líder en el sector de la construcción e ingeniería, reconocida por nuestra innovación, compromiso con la excelencia y contribución al desarrollo sostenible."
    },
    {
      icon: Heart,
      title: "Valores",
      description: "Integridad, compromiso, innovación, trabajo en equipo, responsabilidad social y ambiental son los pilares que guían cada uno de nuestros proyectos."
    },
  ];

  const values = [
    {
      icon: Target,
      title: "Misión",
      description: aboutData?.mission || defaultValues[0].description
    },
    {
      icon: Eye,
      title: "Visión",
      description: aboutData?.vision || defaultValues[1].description
    },
    {
      icon: Heart,
      title: "Valores",
      description: aboutData?.values?.join(", ") || defaultValues[2].description
    },
  ];

  const description = aboutData?.description || `ALEKSEY nació hace más de una década con la visión de transformar el sector de la construcción e ingeniería en nuestra región. Desde nuestros humildes comienzos, hemos crecido hasta convertirnos en una empresa líder, reconocida por nuestra dedicación a la excelencia y nuestro compromiso inquebrantable con la calidad.

Nuestro equipo está conformado por profesionales altamente capacitados y apasionados por su trabajo. Ingenieros, arquitectos, técnicos y personal de obra trabajan en conjunto para garantizar que cada proyecto se ejecute con los más altos estándares de calidad y seguridad.

A lo largo de los años, hemos completado más de 500 proyectos exitosos, desde construcciones residenciales hasta grandes obras de infraestructura.`;

  const paragraphs = description.split('\n\n').filter(p => p.trim());

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 tracking-wide text-secondary-foreground">
              SOBRE NOSOTROS
            </h1>
            <p className="text-xl text-secondary-foreground/80 leading-relaxed">
              Más de una década construyendo el futuro con excelencia, innovación y compromiso.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow"
                >
                  <stat.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <div className="text-4xl font-heading font-bold mb-2 text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Content */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-8 text-foreground">
              Nuestra Historia
            </h2>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : (
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((item, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-4 text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-8 text-secondary-foreground">
              Nuestro Equipo
            </h2>
            <p className="text-lg text-secondary-foreground/80 leading-relaxed mb-8">
              Contamos con un equipo multidisciplinario de más de 100 profesionales especializados en diferentes áreas de la construcción e ingeniería. Nuestro capital humano es nuestra mayor fortaleza.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4">
                <div className="text-3xl font-heading font-bold text-primary mb-2">25+</div>
                <div className="text-sm text-secondary-foreground/70">Ingenieros</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-heading font-bold text-primary mb-2">15+</div>
                <div className="text-sm text-secondary-foreground/70">Arquitectos</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-heading font-bold text-primary mb-2">40+</div>
                <div className="text-sm text-secondary-foreground/70">Técnicos</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-heading font-bold text-primary mb-2">50+</div>
                <div className="text-sm text-secondary-foreground/70">Personal de Obra</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default AboutPage;
