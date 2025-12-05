import { Building, Compass } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const construccion = [
  {
    title: "Construcción Residencial",
    description: "Diseño y edificación de viviendas unifamiliares y multifamiliares de alta calidad.",
  },
  {
    title: "Infraestructura Vial",
    description: "Construcción y mantenimiento de carreteras, puentes y vías de acceso.",
  },
  {
    title: "Edificaciones Comerciales e Industriales",
    description: "Construcción de naves industriales, oficinas y locales comerciales adaptados a sus necesidades.",
  },
];

const ingenieria = [
  {
    title: "Diseño y Análisis Estructural",
    description: "Servicios de ingeniería para el diseño, cálculo y análisis de estructuras de edificios y obras civiles.",
  },
  {
    title: "Ingeniería Geotécnica y Cimentaciones",
    description: "Estudios de suelo, diseño de cimentaciones y soluciones geotécnicas para proyectos de construcción.",
  },
  {
    title: "Ingeniería de Infraestructuras Viales",
    description: "Planificación, diseño y supervisión de proyectos de carreteras, puentes y vías de acceso.",
  },
];

const Services = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: construccionRef, isVisible: construccionVisible } = useScrollAnimation(0.2);
  const { ref: ingenieriaRef, isVisible: ingenieriaVisible } = useScrollAnimation(0.2);

  return (
    <section id="services" className="py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div 
          ref={titleRef}
          className={`text-center mb-16 opacity-0 ${titleVisible ? "animate-fade-in" : ""}`}
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
            NUESTROS SERVICIOS
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ofrecemos una gama completa de servicios para satisfacer todas sus necesidades de construcción e ingeniería
          </p>
        </div>

        {/* Construcción */}
        <div ref={construccionRef} className="mb-16">
          <div className={`flex items-center gap-3 mb-8 opacity-0 ${construccionVisible ? "animate-fade-in-left" : ""}`}>
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground tracking-wide">Construcción</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {construccion.map((item, index) => (
              <Card 
                key={index} 
                className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card opacity-0 ${
                  construccionVisible ? "animate-fade-in-up" : ""
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-6">
                  <h4 className="text-lg font-heading font-bold text-foreground mb-3">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ingeniería */}
        <div ref={ingenieriaRef}>
          <div className={`flex items-center gap-3 mb-8 opacity-0 ${ingenieriaVisible ? "animate-fade-in-left" : ""}`}>
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground tracking-wide">Ingeniería</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ingenieria.map((item, index) => (
              <Card 
                key={index} 
                className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card opacity-0 ${
                  ingenieriaVisible ? "animate-fade-in-up" : ""
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-6">
                  <h4 className="text-lg font-heading font-bold text-foreground mb-3">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
