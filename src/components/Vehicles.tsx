import { Truck } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const vehicles = [
  {
    title: "Ford Transit Cargo Van",
    description: "Motor 3.5L V6, Transmisión automática, Capacidad de carga 1,800 kg, Aire acondicionado, Conectividad Bluetooth.",
  },
  {
    title: "Ram 2500 Heavy Duty Pickup",
    description: "Motor 6.4L HEMI V8, Transmisión automática de 8 velocidades, Capacidad de remolque 8,000 kg, Tracción 4x4, Asientos de tela.",
  },
  {
    title: "Isuzu NPR Box Truck",
    description: "Motor diésel 5.2L, Transmisión automática, Caja seca de 16 pies, Capacidad de carga 4,500 kg, Frenos ABS.",
  },
];

const Vehicles = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="vehicles" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {vehicles.map((vehicle, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">{vehicle.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{vehicle.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={scrollToContact}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider px-8"
          >
            SOLICITAR COTIZACIÓN
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Vehicles;
