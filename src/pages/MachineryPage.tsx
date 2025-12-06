import { useState } from "react";
import { Settings, Clock, Shield, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useMachinery, Machinery } from "@/hooks/useSiteData";
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
  const [selectedMachine, setSelectedMachine] = useState<Machinery | null>(null);
  
  const { data: machinery, isLoading } = useMachinery();

  const scrollToContact = () => {
    navigate("/#contact");
  };

  const getDefaultImage = (index: number) => defaultImages[index % defaultImages.length];

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          ) : machinery.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No hay maquinaria disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {machinery.map((item, index) => (
                <Card 
                  key={item.id}
                  onClick={() => setSelectedMachine(item)}
                  className={`group cursor-pointer overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                    machineryVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={item.image_url || getDefaultImage(index)} 
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                      item.is_available 
                        ? "bg-green-500 text-white" 
                        : "bg-red-500 text-white"
                    }`}>
                      {item.is_available ? "Disponible" : "No disponible"}
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-heading font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    {item.brand && (
                      <p className="text-sm text-muted-foreground mb-2">{item.brand} {item.model}</p>
                    )}
                    {(item as any).price && (
                      <p className="text-lg font-bold text-primary">$ {(item as any).price}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Machine Detail Modal */}
      <Dialog open={!!selectedMachine} onOpenChange={() => setSelectedMachine(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading font-bold">
              {selectedMachine?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMachine && (
            <div className="space-y-6">
              <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
                <img 
                  src={selectedMachine.image_url || getDefaultImage(0)} 
                  alt={selectedMachine.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-4 right-4 px-4 py-2 rounded-full font-bold ${
                  selectedMachine.is_available 
                    ? "bg-green-500 text-white" 
                    : "bg-red-500 text-white"
                }`}>
                  {selectedMachine.is_available ? "Disponible" : "No disponible"}
                </div>
              </div>
              
              {selectedMachine.description && (
                <p className="text-muted-foreground">{selectedMachine.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {selectedMachine.brand && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Marca</span>
                    <p className="font-bold text-foreground">{selectedMachine.brand}</p>
                  </div>
                )}
                {selectedMachine.model && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Modelo</span>
                    <p className="font-bold text-foreground">{selectedMachine.model}</p>
                  </div>
                )}
                {selectedMachine.category && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Categoría</span>
                    <p className="font-bold text-foreground">{selectedMachine.category}</p>
                  </div>
                )}
                {(selectedMachine as any).price && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Precio</span>
                    <p className="font-bold text-primary text-lg">$ {(selectedMachine as any).price}</p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => {
                  setSelectedMachine(null);
                  scrollToContact();
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
                disabled={!selectedMachine.is_available}
              >
                {selectedMachine.is_available ? "SOLICITAR COTIZACIÓN" : "NO DISPONIBLE"}
              </Button>
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