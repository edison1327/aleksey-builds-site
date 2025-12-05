import { Settings } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const machinery = [
  {
    title: "Excavadora Caterpillar 320D",
    description: "Excavadora hidráulica de tamaño mediano, ideal para proyectos de construcción general, excavación de zanjas y movimiento de tierras.",
    price: "$350/día",
  },
  {
    title: "Cargador Frontal Volvo L120H",
    description: "Cargador de ruedas versátil y eficiente, perfecto para carga de materiales, manipulación de agregados y trabajos de cantera.",
    price: "$420/día",
  },
  {
    title: "Retroexcavadora JCB 3CX",
    description: "Máquina compacta y multifuncional, excelente para excavación, carga y nivelación en espacios reducidos.",
    price: "$280/día",
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-wide">
              MAQUINARIA PESADA
            </h2>
          </div>
          <p className="text-lg text-secondary-foreground/80 max-w-2xl mx-auto">
            Alquiler de equipos de última generación para proyectos de cualquier escala
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {machinery.map((item, index) => (
            <Card key={index} className="group bg-secondary-foreground/10 border-0 hover:bg-secondary-foreground/15 transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6">
                <h3 className="text-xl font-heading font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-secondary-foreground/70 leading-relaxed mb-4">{item.description}</p>
                <p className="text-2xl font-heading font-bold text-primary">{item.price}</p>
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
