import { Award, Users, Clock, CheckCircle } from "lucide-react";
import { useAboutContent, useHeroContent } from "@/hooks/useSiteData";
import { Skeleton } from "@/components/ui/skeleton";

const defaultStats = [
  { icon: Award, value: "10+", label: "Años de Experiencia" },
  { icon: Users, value: "500+", label: "Proyectos Completados" },
  { icon: Clock, value: "100%", label: "Entregas a Tiempo" },
  { icon: CheckCircle, value: "98%", label: "Clientes Satisfechos" },
];

const About = () => {
  const { data: aboutData, isLoading: aboutLoading } = useAboutContent();
  const { data: heroData, isLoading: heroLoading } = useHeroContent();

  const isLoading = aboutLoading || heroLoading;

  const stats = [
    { icon: Award, value: `${heroData?.years_count || 10}+`, label: "Años de Experiencia" },
    { icon: Users, value: `${heroData?.projects_count || 500}+`, label: "Proyectos Completados" },
    { icon: Clock, value: "100%", label: "Entregas a Tiempo" },
    { icon: CheckCircle, value: `${heroData?.clients_percentage || 98}%`, label: "Clientes Satisfechos" },
  ];

  if (isLoading) {
    return (
      <section id="about" className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const description = aboutData?.description || `Somos una empresa constructora con más de una década de experiencia en el sector. Nos especializamos en proyectos residenciales, comerciales e industriales, siempre manteniendo nuestro compromiso con la calidad y la innovación.

Nuestro equipo de profesionales altamente capacitados trabaja con las últimas tecnologías y mejores prácticas de la industria para garantizar resultados excepcionales en cada proyecto.

En ALEKSEY, no solo construimos edificios, construimos relaciones duraderas con nuestros clientes basadas en la confianza, la transparencia y la excelencia.`;

  const paragraphs = description.split('\n\n').filter(p => p.trim());

  return (
    <section id="about" className="py-24 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 tracking-wide">
              {aboutData?.title || "SOBRE ALEKSEY"}
            </h2>
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-lg mb-6 text-secondary-foreground/90 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-secondary-foreground/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-secondary-foreground/15 transition-colors"
              >
                <stat.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                <div className="text-4xl font-heading font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-secondary-foreground/80 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
