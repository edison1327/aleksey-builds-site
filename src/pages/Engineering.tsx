import { useState } from "react";
import { Compass, Check, Clock, Award, Users, Briefcase, HardHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { useServices, useHeroContent, Service } from "@/hooks/useSiteData";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QuickQuoteForm from "@/components/QuickQuoteForm";

import disenoEstructural from "@/assets/diseno-estructural.jpg";
import ingenieriaGeotecnica from "@/assets/ingenieria-geotecnica.jpg";
import ingenieriaVial from "@/assets/ingenieria-vial.jpg";

const defaultImages = [disenoEstructural, ingenieriaGeotecnica, ingenieriaVial];

// Keywords to identify engineering services (normalized without accents)
const ingenieriaKeywords = ["ingenieria", "diseno", "estructural", "geotecnica", "consultoria", "analisis"];

// Helper to normalize text for matching (remove accents and lowercase)
const normalizeText = (text: string) => 
  text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const Engineering = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: servicesRef, isVisible: servicesVisible } = useScrollAnimation(0.1);
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation(0.2);
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  const { data: allServices, isLoading } = useServices();
  const { data: heroData } = useHeroContent();

  // Filter engineering services
  const services = allServices.filter(s => {
    const normalized = normalizeText(s.title);
    return ingenieriaKeywords.some(k => normalized.includes(k));
  });

  // Use hero_content stats (single source of truth)
  const stats = [
    { value: `${heroData?.years_count || 10}+`, label: "Años de Experiencia", desc: "Trayectoria en el sector", icon: Award },
    { value: `${heroData?.projects_count || 150}+`, label: "Proyectos Completados", desc: "Proyectos diseñados y supervisados", icon: Users },
    { value: `${heroData?.clients_percentage || 98}%`, label: "Clientes Satisfechos", desc: "Satisfacción garantizada", icon: Clock },
    { value: `${heroData?.active_projects_count || 5}`, label: "Proyectos Activos", desc: "Proyectos en desarrollo", icon: Briefcase },
    { value: `${heroData?.employees_count || 50}+`, label: "Empleados", desc: "Ingenieros especializados", icon: HardHat },
  ];

  const scrollToContact = () => {
    navigate("/");
    setTimeout(() => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const getServiceImage = (service: Service, index: number) => {
    return service.image_url || defaultImages[index % defaultImages.length];
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 bg-secondary">
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
      <section ref={servicesRef} className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${servicesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
              NUESTROS SERVICIOS
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ofrecemos servicios de ingeniería especializados para garantizar el éxito de su proyecto
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No hay servicios de ingeniería disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <Card 
                  key={service.id}
                  className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    servicesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={getServiceImage(service, index)} 
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-heading font-bold text-foreground mb-2 line-clamp-1">
                      {service.title}
                    </h3>
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                    )}
                  </CardContent>
                </Card>
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
              Experiencia y profesionalismo en cada proyecto de ingeniería
            </p>
          </div>

          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={index}
                className={`bg-secondary-foreground/10 border-0 text-center opacity-0 ${
                  statsVisible ? "animate-scale-in" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-3xl md:text-4xl font-heading font-bold text-primary mb-1">{stat.value}</p>
                  <h3 className="text-sm md:text-base font-heading font-bold mb-1">{stat.label}</h3>
                  <p className="text-secondary-foreground/70 text-xs hidden md:block">{stat.desc}</p>
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

      {/* Service Detail Modal */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading font-bold">
              {selectedService?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div className="relative h-64 rounded-lg overflow-hidden">
                <img 
                  src={selectedService.image_url || defaultImages[0]} 
                  alt={selectedService.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {selectedService.description && (
                <p className="text-muted-foreground leading-relaxed">{selectedService.description}</p>
              )}
              {selectedService.features && selectedService.features.length > 0 && (
                <div>
                  <h4 className="text-lg font-heading font-semibold text-foreground mb-3">Características</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedService.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1 rounded-full">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <QuickQuoteForm 
                itemName={selectedService.title} 
                itemType="servicio"
                onSuccess={() => setSelectedService(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Engineering;