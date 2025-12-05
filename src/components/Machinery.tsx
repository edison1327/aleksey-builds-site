import { Settings } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link } from "react-router-dom";

import excavadoraCaterpillar from "@/assets/excavadora-caterpillar.jpg";
import cargadorVolvo from "@/assets/cargador-volvo.jpg";
import retroexcavadoraJcb from "@/assets/retroexcavadora-jcb.jpg";

const machinery = [
  {
    title: "Excavadora Caterpillar 320D",
    description: "Excavadora hidráulica de tamaño mediano, ideal para proyectos de construcción general, excavación de zanjas y movimiento de tierras.",
    price: "$350/día",
    image: excavadoraCaterpillar,
  },
  {
    title: "Cargador Frontal Volvo L120H",
    description: "Cargador de ruedas versátil y eficiente, perfecto para carga de materiales, manipulación de agregados y trabajos de cantera.",
    price: "$420/día",
    image: cargadorVolvo,
  },
  {
    title: "Retroexcavadora JCB 3CX",
    description: "Máquina compacta y multifuncional, excelente para excavación, carga y nivelación en espacios reducidos.",
    price: "$280/día",
    image: retroexcavadoraJcb,
  },
];

const Machinery = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation(0.2);

  return (
    <section id="machinery" className="py-24 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div 
          ref={titleRef}
          className={`text-center mb-16 opacity-0 ${titleVisible ? "animate-fade-in" : ""}`}
        >
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

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {machinery.map((item, index) => (
            <Card 
              key={index} 
              className={`group bg-secondary-foreground/10 border-0 hover:bg-secondary-foreground/15 transition-all duration-300 hover:-translate-y-2 overflow-hidden opacity-0 ${
                cardsVisible ? "animate-fade-in-up" : ""
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-heading font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-secondary-foreground/70 leading-relaxed mb-4">{item.description}</p>
                <p className="text-2xl font-heading font-bold text-primary">{item.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className={`text-center mt-12 opacity-0 ${cardsVisible ? "animate-fade-in-up" : ""}`} style={{ animationDelay: "0.5s" }}>
          <Link to="/maquinaria">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider px-8"
            >
              VER MÁS MAQUINARIA
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Machinery;
