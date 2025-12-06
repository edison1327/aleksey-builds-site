import { Building, Check, Clock, Award, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useServices, useHeroContent } from "@/hooks/useSiteData";
import { Skeleton } from "@/components/ui/skeleton";

import construccionResidencial from "@/assets/construccion-residencial.jpg";
import infraestructuraVial from "@/assets/infraestructura-vial.jpg";
import edificacionesComerciales from "@/assets/edificaciones-comerciales.jpg";
import movimientoTierras from "@/assets/movimiento-tierras.jpg";
import consultoriaProyectos from "@/assets/consultoria-proyectos.jpg";

const defaultImages = [construccionResidencial, infraestructuraVial, edificacionesComerciales, movimientoTierras, consultoriaProyectos];

// Keywords to identify construction services
const construccionKeywords = ["construcción", "residencial", "comercial", "edificacion", "infraestructura", "movimiento", "tierras", "industrial"];

const Construction = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: servicesRef, isVisible: servicesVisible } = useScrollAnimation(0.1);
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation(0.2);
  const navigate = useNavigate();
  
  const { data: allServices, isLoading } = useServices();
  const { data: heroData } = useHeroContent();

  // Filter construction services
  const services = allServices.filter(s => 
    construccionKeywords.some(k => s.title.toLowerCase().includes(k))
  );

  const stats = [
    { value: `${heroData?.years_count || 10}+`, label: "Años de Experiencia", desc: "Más de una década construyendo proyectos exitosos", icon: Clock },
    { value: `${heroData?.projects_count || 100}+`, label: "Proyectos Completados", desc: "Cientos de proyectos entregados con éxito", icon: Award },
    { value: "24/7", label: "Soporte Continuo", desc: "Atención y seguimiento durante todo el proyecto", icon: Users },
  ];

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
            <Building className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-secondary-foreground tracking-wide mb-6">
            CONSTRUCCIÓN
          </h1>
          <p className="text-xl text-primary max-w-3xl mx-auto leading-relaxed">
            Transformamos ideas en estructuras sólidas. Nuestro equipo de expertos en construcción ofrece soluciones integrales para proyectos residenciales, comerciales e industriales.
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
              Ofrecemos una amplia gama de servicios de construcción adaptados a sus necesidades específicas
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-16">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Skeleton className="h-80 w-full rounded-2xl" />
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No hay servicios de construcción disponibles.</p>
            </div>
          ) : (
            <div ref={servicesRef} className="space-y-16">
              {services.map((service, index) => (
                <div 
                  key={service.id}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center opacity-0 ${
                    servicesVisible ? "animate-fade-in-up" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
                      <img 
                        src={service.image_url || defaultImages[index % defaultImages.length]} 
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                    <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                      {service.title}
                    </h3>
                    {service.description && (
                      <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
                    )}
                    {service.features && service.features.length > 0 && (
                      <>
                        <h4 className="text-lg font-heading font-semibold text-foreground mb-3">Características</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {service.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="bg-primary/10 p-1 rounded-full">
                                <Check className="h-4 w-4 text-primary" />
                              </div>
                              <span className="text-sm text-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              Nuestra experiencia y compromiso nos distinguen en el sector de la construcción
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

          <Card className="bg-secondary-foreground/10 border-0 mt-8">
            <CardContent className="p-8 text-center">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-2">Calidad Garantizada</h3>
              <p className="text-secondary-foreground/70 text-sm">
                Materiales de primera calidad y mano de obra especializada
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-wide">
            ¿TIENE UN PROYECTO EN MENTE?
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Contáctenos para una consulta gratuita y descubra cómo podemos hacer realidad su proyecto de construcción
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

export default Construction;
