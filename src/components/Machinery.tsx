import { Truck, HardHat, Cog, Wrench } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const machinery = [
  {
    icon: Truck,
    title: "Camiones y Volquetes",
    description: "Transporte de materiales y escombros con flota moderna y confiable.",
  },
  {
    icon: HardHat,
    title: "Excavadoras",
    description: "Equipos de excavación de diferentes capacidades para todo tipo de obra.",
  },
  {
    icon: Cog,
    title: "Retroexcavadoras",
    description: "Maquinaria versátil para excavación, carga y movimiento de tierra.",
  },
  {
    icon: Wrench,
    title: "Grúas y Montacargas",
    description: "Equipos de elevación para construcción en altura y logística.",
  },
];

const Machinery = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="machinery" className="py-24 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-wide">
            MAQUINARIA PESADA
          </h2>
          <p className="text-lg text-secondary-foreground/80 max-w-2xl mx-auto">
            Alquiler de equipos de última generación para proyectos de cualquier escala
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {machinery.map((item, index) => (
            <Card
              key={index}
              className="group bg-secondary-foreground/10 border-0 hover:bg-secondary-foreground/15 transition-all duration-300"
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <item.icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-lg font-heading font-bold mb-2 tracking-wide">
                  {item.title}
                </h3>
                <p className="text-sm text-secondary-foreground/70">
                  {item.description}
                </p>
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

export default Machinery;
