import { useState } from "react";
import { Truck, Clock, Shield, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { useVehicles, Vehicle } from "@/hooks/useSiteData";
import { useLocalizedField } from "@/lib/i18nField";
import { Skeleton } from "@/components/ui/skeleton";
import QuickQuoteForm from "@/components/QuickQuoteForm";
import SEO from "@/components/SEO";

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
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const tr = useLocalizedField();
  
  const { data: vehicles, isLoading } = useVehicles();

  const scrollToContact = () => {
    navigate("/");
    setTimeout(() => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const getDefaultImage = (index: number) => defaultImages[index % defaultImages.length];

  return (
    <div className="min-h-dvh">
      <SEO
        title="Alquiler de Vehículos — ALEKSEY"
        description="Camionetas, vans y camiones para tu proyecto. Flota con seguro incluido, mantenimiento preventivo y disponibilidad 24/7 en todo el Perú."
        path="/vehiculos"
      />
      {/* Hero Section */}
      <section className="relative pt-24 bg-secondary">
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
      <section ref={vehiclesRef} className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${vehiclesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
              NUESTRA FLOTA
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vehículos comerciales de última generación para cualquier tipo de trabajo
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No hay vehículos disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle, index) => (
                <Card 
                  key={vehicle.id}
                  id={`card-${vehicle.id}`}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`group cursor-pointer overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-500 hover:-translate-y-2 scroll-mt-28 ${
                    vehiclesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={vehicle.image_url || getDefaultImage(index)} 
                      alt={tr(vehicle as any, "name") || vehicle.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                      vehicle.is_available 
                        ? "bg-green-500 text-white" 
                        : "bg-red-500 text-white"
                    }`}>
                      {vehicle.is_available ? "Disponible" : "No disponible"}
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-heading font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {tr(vehicle as any, "name") || vehicle.name}
                    </h3>
                    {vehicle.brand && (
                      <p className="text-sm text-muted-foreground mb-2">{vehicle.brand} {vehicle.model}</p>
                    )}
                    {(vehicle as any).price && (
                      <p className="text-lg font-bold text-primary">$ {(vehicle as any).price}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vehicle Detail Modal */}
      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading font-bold">
              {tr(selectedVehicle as any, "name") || selectedVehicle?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6">
              <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
                <img 
                  src={selectedVehicle.image_url || getDefaultImage(0)} 
                  alt={tr(selectedVehicle as any, "name") || selectedVehicle.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-4 right-4 px-4 py-2 rounded-full font-bold ${
                  selectedVehicle.is_available 
                    ? "bg-green-500 text-white" 
                    : "bg-red-500 text-white"
                }`}>
                  {selectedVehicle.is_available ? "Disponible" : "No disponible"}
                </div>
              </div>
              
              {(tr(selectedVehicle as any, "description") || selectedVehicle.description) && (
                <p className="text-muted-foreground">{tr(selectedVehicle as any, "description") || selectedVehicle.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {selectedVehicle.brand && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Marca</span>
                    <p className="font-bold text-foreground">{selectedVehicle.brand}</p>
                  </div>
                )}
                {selectedVehicle.model && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Modelo</span>
                    <p className="font-bold text-foreground">{selectedVehicle.model}</p>
                  </div>
                )}
                {selectedVehicle.category && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Categoría</span>
                    <p className="font-bold text-foreground">{tr(selectedVehicle as any, "category") || selectedVehicle.category}</p>
                  </div>
                )}
                {(selectedVehicle as any).price && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Precio</span>
                    <p className="font-bold text-primary text-lg">$ {(selectedVehicle as any).price}</p>
                  </div>
                )}
              </div>
              
              {selectedVehicle.is_available ? (
                <QuickQuoteForm 
                  itemName={selectedVehicle.name} 
                  itemType="vehículo"
                  onSuccess={() => setSelectedVehicle(null)}
                />
              ) : (
                <div className="border-t pt-4 mt-4">
                  <p className="text-center text-muted-foreground">
                    Este vehículo no está disponible actualmente.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${benefitsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-wide">
              ¿POR QUÉ ALQUILAR CON NOSOTROS?
            </h2>
            <p className="text-lg text-secondary-foreground/80 max-w-2xl mx-auto">
              Servicio completo y confiable para su tranquilidad
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
