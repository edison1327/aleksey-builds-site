import { Truck, Calculator } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link, useNavigate } from "react-router-dom";
import ParallaxImage from "./ParallaxImage";
import { useVehicles } from "@/hooks/useSiteData";

import fordTransit from "@/assets/ford-transit.jpg";
import ram2500 from "@/assets/ram-2500.jpg";
import isuzuNpr from "@/assets/isuzu-npr.jpg";

// Default vehicles for when database is empty
const defaultVehicles = [
  {
    id: "1",
    name: "Ford Transit Cargo Van",
    description: "Motor 3.5L V6, Transmisión automática, Capacidad de carga 1,800 kg, Aire acondicionado, Conectividad Bluetooth.",
    image_url: fordTransit,
    is_available: true,
  },
  {
    id: "2",
    name: "Ram 2500 Heavy Duty Pickup",
    description: "Motor 6.4L HEMI V8, Transmisión automática de 8 velocidades, Capacidad de remolque 8,000 kg, Tracción 4x4, Asientos de tela.",
    image_url: ram2500,
    is_available: true,
  },
  {
    id: "3",
    name: "Isuzu NPR Box Truck",
    description: "Motor diésel 5.2L, Transmisión automática, Caja seca de 16 pies, Capacidad de carga 4,500 kg, Frenos ABS.",
    image_url: isuzuNpr,
    is_available: true,
  },
];

const Vehicles = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation(0.2);
  const { data: dbVehicles } = useVehicles(3);
  const navigate = useNavigate();
  
  // Use database vehicles if available, otherwise use defaults
  const vehicles = dbVehicles.length > 0 ? dbVehicles : defaultVehicles;

  return (
    <section id="vehicles" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div 
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-100"}`}
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
              key={vehicle.id} 
              className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card overflow-hidden ${
                cardsVisible ? "opacity-100 translate-y-0" : "opacity-100"
              }`}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-48">
                <ParallaxImage 
                  src={vehicle.image_url || fordTransit} 
                  alt={vehicle.name}
                  className="h-full"
                  speed={0.15}
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">{vehicle.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{vehicle.description}</p>
                {(vehicle as any).price && (
                  <p className="text-lg font-bold text-primary mb-2">$ {(vehicle as any).price}</p>
                )}
                <div className="flex items-center justify-between">
                  {vehicle.is_available !== undefined && (
                    <span className={`text-sm ${vehicle.is_available ? "text-green-600 font-bold" : "text-red-600"}`}>
                      {vehicle.is_available ? "Disponible" : "No disponible"}
                    </span>
                  )}
                  {vehicle.is_available && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/cotizar?tipo=vehiculo&id=${vehicle.id}`)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading text-xs"
                    >
                      <Calculator className="h-3 w-3 mr-1" />
                      Cotizar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className={`text-center mt-12 transition-all duration-700 ${cardsVisible ? "opacity-100 translate-y-0" : "opacity-100"}`}>
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
