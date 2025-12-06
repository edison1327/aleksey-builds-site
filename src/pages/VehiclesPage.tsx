import { Truck, Clock, Shield, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useVehicles } from "@/hooks/useSiteData";
import { Skeleton } from "@/components/ui/skeleton";

import fordTransit from "@/assets/ford-transit.jpg";
import ram2500 from "@/assets/ram-2500.jpg";
import isuzuNpr from "@/assets/isuzu-npr.jpg";

const defaultImages = [fordTransit, ram2500, isuzuNpr];

const benefits = [
  { icon: Shield, title: "Seguro Incluido", desc: "Todos nuestros vehículos incluyen seguro completo" },
  { icon: Wrench, title: "Mantenimiento", desc: "Flota con mantenimiento preventivo al día" },
  { icon: Clock, title: "Disponibilidad 24/7", desc: "Servicio de atención y emergencias las 24 horas" },
];

const VehiclesPage = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: vehiclesRef, isVisible: vehiclesVisible } = useScrollAnimation(0.1);
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollAnimation(0.2);
  const navigate = useNavigate();
  
  const { data: vehicles, isLoading } = useVehicles();

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
            <Truck className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-secondary-foreground tracking-wide mb-6">
            ALQUILER DE VEHÍCULOS
          </h1>
          <p className="text-xl text-primary max-w-3xl mx-auto leading-relaxed">
            Flota de vehículos comerciales modernos y confiables para todas sus necesidades de transporte y logística.
          </p>
        </div>
      </section>

      {/* Vehicles Section */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 opacity-0 ${vehiclesVisible ? "animate-fade-in" : ""}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
              NUESTRA FLOTA
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vehículos comerciales de última generación para cualquier tipo de trabajo
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
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No hay vehículos disponibles.</p>
            </div>
          ) : (
            <div ref={vehiclesRef} className="space-y-16">
              {vehicles.map((vehicle, index) => (
                <div 
                  key={vehicle.id}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center opacity-0 ${
                    vehiclesVisible ? "animate-fade-in-up" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
                      <img 
                        src={vehicle.image_url || defaultImages[index % defaultImages.length]} 
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-4 right-4 px-4 py-2 rounded-full font-heading font-bold ${
                        vehicle.is_available 
                          ? "bg-green-500 text-white" 
                          : "bg-red-500 text-white"
                      }`}>
                        {vehicle.is_available ? "Disponible" : "No disponible"}
                      </div>
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                    <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                      {vehicle.name}
                    </h3>
                    {vehicle.description && (
                      <p className="text-muted-foreground mb-4">{vehicle.description}</p>
                    )}
                    <div className="space-y-2 mb-6">
                      {vehicle.brand && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Marca:</span>
                          <span className="text-sm text-muted-foreground">{vehicle.brand}</span>
                        </div>
                      )}
                      {vehicle.model && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Modelo:</span>
                          <span className="text-sm text-muted-foreground">{vehicle.model}</span>
                        </div>
                      )}
                      {vehicle.category && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Categoría:</span>
                          <span className="text-sm text-muted-foreground">{vehicle.category}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={scrollToContact}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
                      disabled={!vehicle.is_available}
                    >
                      {vehicle.is_available ? "SOLICITAR COTIZACIÓN" : "NO DISPONIBLE"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 opacity-0 ${benefitsVisible ? "animate-fade-in" : ""}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-wide">
              ¿POR QUÉ ALQUILAR CON NOSOTROS?
            </h2>
            <p className="text-lg text-secondary-foreground/80 max-w-2xl mx-auto">
              Servicio completo y confiable para su tranquilidad
            </p>
          </div>

          <div ref={benefitsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className={`bg-secondary-foreground/10 border-0 text-center opacity-0 ${
                  benefitsVisible ? "animate-scale-in" : ""
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
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
            ¿NECESITA UN VEHÍCULO?
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Contáctenos para conocer disponibilidad y tarifas especiales
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

export default VehiclesPage;
