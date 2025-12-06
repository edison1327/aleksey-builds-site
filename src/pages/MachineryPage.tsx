import { Settings, Check, Clock, Shield, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useMachinery } from "@/hooks/useSiteData";
import { Skeleton } from "@/components/ui/skeleton";

import excavadoraCaterpillar from "@/assets/excavadora-caterpillar.jpg";
import cargadorVolvo from "@/assets/cargador-volvo.jpg";
import retroexcavadoraJcb from "@/assets/retroexcavadora-jcb.jpg";

const defaultImages = [excavadoraCaterpillar, cargadorVolvo, retroexcavadoraJcb];

const benefits = [
  { icon: Shield, title: "Equipos Certificados", desc: "Toda nuestra maquinaria cuenta con certificaciones vigentes" },
  { icon: Wrench, title: "Soporte Técnico", desc: "Servicio técnico especializado disponible en obra" },
  { icon: Clock, title: "Entrega Rápida", desc: "Entrega y recogida en el lugar de su proyecto" },
];

const MachineryPage = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: machineryRef, isVisible: machineryVisible } = useScrollAnimation(0.1);
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollAnimation(0.2);
  const navigate = useNavigate();
  
  const { data: machinery, isLoading } = useMachinery();

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
            <Settings className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-secondary-foreground tracking-wide mb-6">
            MAQUINARIA PESADA
          </h1>
          <p className="text-xl text-primary max-w-3xl mx-auto leading-relaxed">
            Alquiler de equipos de construcción de última generación. Maquinaria pesada para proyectos de cualquier escala.
          </p>
        </div>
      </section>

      {/* Machinery Section */}
      <section ref={machineryRef} className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${machineryVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
              NUESTROS EQUIPOS
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Maquinaria de marcas líderes con mantenimiento al día
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
          ) : machinery.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No hay maquinaria disponible.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {machinery.map((item, index) => (
                <div 
                  key={item.id}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center transition-all duration-700 ${
                    machineryVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
                      <img 
                        src={item.image_url || defaultImages[index % defaultImages.length]} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-4 right-4 px-4 py-2 rounded-full font-heading font-bold ${
                        item.is_available 
                          ? "bg-green-500 text-white" 
                          : "bg-red-500 text-white"
                      }`}>
                        {item.is_available ? "Disponible" : "No disponible"}
                      </div>
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                    <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-muted-foreground mb-4">{item.description}</p>
                    )}
                    <div className="space-y-2 mb-6">
                      {item.brand && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Marca:</span>
                          <span className="text-sm text-muted-foreground">{item.brand}</span>
                        </div>
                      )}
                      {item.model && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Modelo:</span>
                          <span className="text-sm text-muted-foreground">{item.model}</span>
                        </div>
                      )}
                      {item.category && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Categoría:</span>
                          <span className="text-sm text-muted-foreground">{item.category}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={scrollToContact}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
                      disabled={!item.is_available}
                    >
                      {item.is_available ? "SOLICITAR COTIZACIÓN" : "NO DISPONIBLE"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${benefitsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-wide">
              ¿POR QUÉ ALQUILAR CON NOSOTROS?
            </h2>
            <p className="text-lg text-secondary-foreground/80 max-w-2xl mx-auto">
              Garantizamos equipos en óptimas condiciones y soporte técnico profesional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className={`bg-secondary-foreground/10 border-0 text-center transition-all duration-700 ${
                  benefitsVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-8">
                  <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2">{benefit.title}</h3>
                  <p className="text-secondary-foreground/70 text-sm">{benefit.desc}</p>
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
            ¿NECESITA MAQUINARIA PARA SU PROYECTO?
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Contáctenos para conocer disponibilidad y tarifas especiales por proyectos largos
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

export default MachineryPage;
