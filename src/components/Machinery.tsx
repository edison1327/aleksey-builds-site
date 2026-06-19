import { Settings, Calculator } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link, useNavigate } from "react-router-dom";
import ParallaxImage from "./ParallaxImage";
import { useMachinery } from "@/hooks/useSiteData";
import { useLocalizedField } from "@/lib/i18nField";
import { useTranslation } from "react-i18next";

import excavadoraCaterpillar from "@/assets/excavadora-caterpillar.jpg";
import cargadorVolvo from "@/assets/cargador-volvo.jpg";
import retroexcavadoraJcb from "@/assets/retroexcavadora-jcb.jpg";

// Default machinery for when database is empty
const defaultMachinery = [
  {
    id: "1",
    name: "Excavadora Caterpillar 320D",
    description: "Excavadora hidráulica de tamaño mediano, ideal para proyectos de construcción general, excavación de zanjas y movimiento de tierras.",
    image_url: excavadoraCaterpillar,
    is_available: true,
  },
  {
    id: "2",
    name: "Cargador Frontal Volvo L120H",
    description: "Cargador de ruedas versátil y eficiente, perfecto para carga de materiales, manipulación de agregados y trabajos de cantera.",
    image_url: cargadorVolvo,
    is_available: true,
  },
  {
    id: "3",
    name: "Retroexcavadora JCB 3CX",
    description: "Máquina compacta y multifuncional, excelente para excavación, carga y nivelación en espacios reducidos.",
    image_url: retroexcavadoraJcb,
    is_available: true,
  },
];

const Machinery = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation(0.2);
  const { data: dbMachinery } = useMachinery(3);
  const navigate = useNavigate();
  const tr = useLocalizedField();
  const { t } = useTranslation();

  // Use database machinery if available, otherwise use defaults
  const machinery = dbMachinery.length > 0 ? dbMachinery : defaultMachinery;

  return (
    <section id="machinery" className="py-24 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div 
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-100"}`}
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
              key={item.id} 
              className={`group bg-secondary-foreground/10 border-0 hover:bg-secondary-foreground/15 transition-all duration-300 hover:-translate-y-2 overflow-hidden ${
                cardsVisible ? "opacity-100 translate-y-0" : "opacity-100"
              }`}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-48">
                <ParallaxImage 
                  src={item.image_url || excavadoraCaterpillar} 
                  alt={item.name}
                  className="h-full"
                  speed={0.15}
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-heading font-bold mb-3">{tr(item as any, "name") || item.name}</h3>
                <p className="text-sm text-secondary-foreground/70 leading-relaxed mb-4">{tr(item as any, "description") || item.description}</p>
                {(item as any).price && (
                  <p className="text-lg font-bold text-primary mb-2">$ {(item as any).price}</p>
                )}
                <div className="flex items-center justify-between">
                  {item.is_available !== undefined && (
                    <span className={`text-sm ${item.is_available ? "text-green-400 font-bold" : "text-red-400"}`}>
                      {item.is_available ? "Disponible" : "No disponible"}
                    </span>
                  )}
                  {item.is_available && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/cotizar?tipo=maquinaria&id=${item.id}`)}
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
