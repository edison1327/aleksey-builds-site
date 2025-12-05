import { Compass, Check, Clock, Award, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import disenoEstructural from "@/assets/diseno-estructural.jpg";
import ingenieriaGeotecnica from "@/assets/ingenieria-geotecnica.jpg";
import ingenieriaVial from "@/assets/ingenieria-vial.jpg";

const services = [
  {
    title: "Diseño y Análisis Estructural",
    shortDesc: "Servicios de ingeniería para el diseño, cálculo y análisis de estructuras de edificios y obras civiles.",
    longDesc: "Nuestro equipo de ingenieros estructurales ofrece servicios completos de diseño, cálculo y análisis de estructuras para todo tipo de edificaciones. Utilizamos software de última generación y metodologías avanzadas para garantizar la seguridad, estabilidad y eficiencia de cada proyecto, cumpliendo con todas las normativas vigentes.",
    benefits: ["Diseño optimizado", "Seguridad estructural", "Cumplimiento normativo", "Análisis avanzado"],
    image: disenoEstructural,
  },
  {
    title: "Ingeniería Geotécnica y Cimentaciones",
    shortDesc: "Estudios de suelo, diseño de cimentaciones y soluciones geotécnicas para proyectos de construcción.",
    longDesc: "Realizamos estudios geotécnicos completos que incluyen sondeos, ensayos de laboratorio y análisis de suelos. Diseñamos cimentaciones adaptadas a las condiciones específicas de cada terreno, garantizando la estabilidad y durabilidad de las estructuras. Ofrecemos soluciones para terrenos complejos y proyectos especiales.",
    benefits: ["Estudios completos", "Cimentaciones seguras", "Soluciones innovadoras", "Terrenos difíciles"],
    image: ingenieriaGeotecnica,
  },
  {
    title: "Ingeniería de Infraestructuras Viales",
    shortDesc: "Planificación, diseño y supervisión de proyectos de carreteras, puentes y vías de acceso.",
    longDesc: "Ofrecemos servicios integrales de ingeniería vial, desde la planificación y diseño hasta la supervisión de construcción. Nuestro equipo desarrolla proyectos de carreteras, autopistas, puentes, túneles y obras de drenaje, aplicando las mejores prácticas y tecnologías para garantizar infraestructuras seguras y duraderas.",
    benefits: ["Planificación integral", "Diseño vial avanzado", "Supervisión experta", "Infraestructura duradera"],
    image: ingenieriaVial,
  },
];

const stats = [
  { value: "50+", label: "Ingenieros Especializados", desc: "Equipo multidisciplinario de profesionales", icon: Users },
  { value: "200+", label: "Proyectos de Ingeniería", desc: "Proyectos diseñados y supervisados", icon: Award },
  { value: "100%", label: "Cumplimiento Normativo", desc: "Todos nuestros diseños cumplen las normas", icon: Clock },
];

const Engineering = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: servicesRef, isVisible: servicesVisible } = useScrollAnimation(0.1);
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation(0.2);
  const navigate = useNavigate();

  const scrollToContact = () => {
    navigate("/#contact");
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 bg-secondary">
        <div 
          ref={heroRef}
          className={`container mx-auto px-4 py-24 text-center opacity-0 ${heroVisible ? "animate-fade-in" : ""}`}
        >
          <div className="bg-primary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Compass className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-secondary-foreground tracking-wide mb-6">
            INGENIERÍA
          </h1>
          <p className="text-xl text-primary max-w-3xl mx-auto leading-relaxed">
            Soluciones técnicas especializadas para proyectos de construcción. Nuestro equipo de ingenieros ofrece diseño estructural, estudios geotécnicos y supervisión de obras.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 opacity-0 ${servicesVisible ? "animate-fade-in" : ""}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
              NUESTROS SERVICIOS
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ofrecemos servicios de ingeniería especializados para garantizar el éxito de su proyecto
            </p>
          </div>

          <div ref={servicesRef} className="space-y-16">
            {services.map((service, index) => (
              <div 
                key={index}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center opacity-0 ${
                  servicesVisible ? "animate-fade-in-up" : ""
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">{service.shortDesc}</p>
                  <h4 className="text-lg font-heading font-semibold text-foreground mb-2">Descripción Detallada</h4>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{service.longDesc}</p>
                  <h4 className="text-lg font-heading font-semibold text-foreground mb-3">Beneficios Clave</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {service.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1 rounded-full">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 opacity-0 ${statsVisible ? "animate-fade-in" : ""}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-wide">
              ¿POR QUÉ ELEGIRNOS?
            </h2>
            <p className="text-lg text-secondary-foreground/80 max-w-2xl mx-auto">
              Experiencia y profesionalismo en cada proyecto de ingeniería
            </p>
          </div>

          <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <Card 
                key={index}
                className={`bg-secondary-foreground/10 border-0 text-center opacity-0 ${
                  statsVisible ? "animate-scale-in" : ""
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-8">
                  <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-5xl font-heading font-bold text-primary mb-2">{stat.value}</p>
                  <h3 className="text-xl font-heading font-bold mb-2">{stat.label}</h3>
                  <p className="text-secondary-foreground/70 text-sm">{stat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-wide">
            ¿NECESITA ASESORÍA EN INGENIERÍA?
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Contáctenos para una consulta gratuita y descubra cómo nuestros ingenieros pueden ayudarle
          </p>
          <Button
            size="lg"
            onClick={scrollToContact}
            variant="secondary"
            className="font-heading tracking-wider px-8"
          >
            CONTACTAR AHORA
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Engineering;
