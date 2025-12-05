import { Truck } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link } from "react-router-dom";

import fordTransit from "@/assets/ford-transit.jpg";
import ram2500 from "@/assets/ram-2500.jpg";
import isuzuNpr from "@/assets/isuzu-npr.jpg";

const vehicles = [
  {
    title: "Ford Transit Cargo Van",
    description: "Motor 3.5L V6, Transmisión automática, Capacidad de carga 1,800 kg, Aire acondicionado, Conectividad Bluetooth.",
    image: fordTransit,
  },
  {
    title: "Ram 2500 Heavy Duty Pickup",
    description: "Motor 6.4L HEMI V8, Transmisión automática de 8 velocidades, Capacidad de remolque 8,000 kg, Tracción 4x4, Asientos de tela.",
    image: ram2500,
  },
  {
    title: "Isuzu NPR Box Truck",
    description: "Motor diésel 5.2L, Transmisión automática, Caja seca de 16 pies, Capacidad de carga 4,500 kg, Frenos ABS.",
    image: isuzuNpr,
  },
];

const Vehicles = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation(0.2);

  return (
    <section id="vehicles" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div 
          ref={titleRef}
          className={`text-center mb-16 opacity-0 ${titleVisible ? "animate-fade-in" : ""}`}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground tracking-wide">
              ALQUILER VEHÍCULOS
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Flota de vehículos comerciales para todas sus necesidades de transporte
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {vehicles.map((vehicle, index) => (
            <Card 
              key={index} 
              className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card overflow-hidden opacity-0 ${
                cardsVisible ? "animate-scale-in" : ""
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={vehicle.image} 
                  alt={vehicle.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">{vehicle.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{vehicle.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className={`text-center mt-12 opacity-0 ${cardsVisible ? "animate-fade-in-up" : ""}`} style={{ animationDelay: "0.5s" }}>
          <Link to="/vehiculos">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider px-8"
            >
              VER MÁS VEHÍCULOS
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Vehicles;
