import { Building, Compass } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link } from "react-router-dom";
import ParallaxImage from "./ParallaxImage";
import { useServices } from "@/hooks/useSiteData";
import { Skeleton } from "./ui/skeleton";

import construccionResidencial from "@/assets/construccion-residencial.jpg";
import infraestructuraVial from "@/assets/infraestructura-vial.jpg";
import edificacionesComerciales from "@/assets/edificaciones-comerciales.jpg";
import disenoEstructural from "@/assets/diseno-estructural.jpg";
import ingenieriaGeotecnica from "@/assets/ingenieria-geotecnica.jpg";
import ingenieriaVial from "@/assets/ingenieria-vial.jpg";

// Default data as fallback
const defaultConstruccion = [
  {
    title: "Construcción Residencial",
    description: "Diseño y edificación de viviendas unifamiliares y multifamiliares de alta calidad.",
    image: construccionResidencial,
  },
  {
    title: "Infraestructura Vial",
    description: "Construcción y mantenimiento de carreteras, puentes y vías de acceso.",
    image: infraestructuraVial,
  },
  {
    title: "Edificaciones Comerciales e Industriales",
    description: "Construcción de naves industriales, oficinas y locales comerciales adaptados a sus necesidades.",
    image: edificacionesComerciales,
  },
];

const defaultIngenieria = [
  {
    title: "Diseño y Análisis Estructural",
    description: "Servicios de ingeniería para el diseño, cálculo y análisis de estructuras de edificios y obras civiles.",
    image: disenoEstructural,
  },
  {
    title: "Ingeniería Geotécnica y Cimentaciones",
    description: "Estudios de suelo, diseño de cimentaciones y soluciones geotécnicas para proyectos de construcción.",
    image: ingenieriaGeotecnica,
  },
  {
    title: "Ingeniería de Infraestructuras Viales",
    description: "Planificación, diseño y supervisión de proyectos de carreteras, puentes y vías de acceso.",
    image: ingenieriaVial,
  },
];

// Map icon names to default images
const imageMap: Record<string, string> = {
  "Home": construccionResidencial,
  "Construction": infraestructuraVial,
  "Building2": edificacionesComerciales,
  "Ruler": disenoEstructural,
  "Layers": ingenieriaGeotecnica,
  "ClipboardList": ingenieriaVial,
  "Mountain": infraestructuraVial,
};

// Keywords to categorize services
const construccionKeywords = ["construcción", "residencial", "comercial", "edificacion", "infraestructura", "movimiento", "tierras"];
const ingenieriaKeywords = ["ingeniería", "diseño", "estructural", "geotécnica", "consultoría", "vial"];

const Services = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: construccionRef, isVisible: construccionVisible } = useScrollAnimation(0.2);
  const { ref: ingenieriaRef, isVisible: ingenieriaVisible } = useScrollAnimation(0.2);
  
  const { data: servicesData, isLoading } = useServices();

  // Categorize services from DB or use defaults
  const categorizeServices = () => {
    if (!servicesData || servicesData.length === 0) {
      return { construccion: defaultConstruccion, ingenieria: defaultIngenieria };
    }

    const construccion = servicesData
      .filter(s => construccionKeywords.some(k => s.title.toLowerCase().includes(k)))
      .slice(0, 3)
      .map(s => ({
        title: s.title,
        description: s.description || "",
        image: s.image_url || imageMap[s.icon] || construccionResidencial,
      }));

    const ingenieria = servicesData
      .filter(s => ingenieriaKeywords.some(k => s.title.toLowerCase().includes(k)))
      .slice(0, 3)
      .map(s => ({
        title: s.title,
        description: s.description || "",
        image: s.image_url || imageMap[s.icon] || disenoEstructural,
      }));

    return {
      construccion: construccion.length > 0 ? construccion : defaultConstruccion,
      ingenieria: ingenieria.length > 0 ? ingenieria : defaultIngenieria,
    };
  };

  const { construccion, ingenieria } = categorizeServices();

  if (isLoading) {
    return (
      <section id="services" className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="mb-16">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

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
                className={`group border-0 bg-card overflow-hidden opacity-0 hover-border-glow ${
                  construccionVisible ? "animate-fade-in-up" : ""
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <ParallaxImage 
                    src={item.image} 
                    alt={item.title}
                    className="h-full transition-transform duration-500 group-hover:scale-110"
                    speed={0.15}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardContent className="p-6 relative">
                  <h4 className="text-lg font-heading font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className={`text-center mt-8 opacity-0 ${construccionVisible ? "animate-fade-in-up" : ""}`} style={{ animationDelay: "0.5s" }}>
            <Link to="/construccion">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider px-8">
                VER MÁS CONSTRUCCIÓN
              </Button>
            </Link>
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
                className={`group border-0 bg-card overflow-hidden opacity-0 hover-border-glow ${
                  ingenieriaVisible ? "animate-fade-in-up" : ""
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <ParallaxImage 
                    src={item.image} 
                    alt={item.title}
                    className="h-full transition-transform duration-500 group-hover:scale-110"
                    speed={0.15}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardContent className="p-6 relative">
                  <h4 className="text-lg font-heading font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className={`text-center mt-8 opacity-0 ${ingenieriaVisible ? "animate-fade-in-up" : ""}`} style={{ animationDelay: "0.5s" }}>
            <Link to="/ingenieria">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider px-8">
                VER MÁS INGENIERÍA
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
