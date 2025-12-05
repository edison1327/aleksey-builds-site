import { Settings, Check, Clock, Shield, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import excavadoraCaterpillar from "@/assets/excavadora-caterpillar.jpg";
import cargadorVolvo from "@/assets/cargador-volvo.jpg";
import retroexcavadoraJcb from "@/assets/retroexcavadora-jcb.jpg";

const machinery = [
  {
    title: "Excavadora Caterpillar 320D",
    shortDesc: "Excavadora hidráulica de tamaño mediano, ideal para proyectos de construcción general.",
    price: "$350/día",
    specs: [
      "Peso operativo: 20,000 kg",
      "Profundidad de excavación: 6.7 m",
      "Motor: Cat C6.4 ACERT",
      "Potencia: 140 HP",
      "Capacidad del cucharón: 1.2 m³"
    ],
    features: ["Alta productividad", "Bajo consumo", "Fácil mantenimiento", "Cabina confortable"],
    image: excavadoraCaterpillar,
  },
  {
    title: "Cargador Frontal Volvo L120H",
    shortDesc: "Cargador de ruedas versátil y eficiente, perfecto para carga de materiales.",
    price: "$420/día",
    specs: [
      "Peso operativo: 19,500 kg",
      "Capacidad del cucharón: 3.5 m³",
      "Motor: Volvo D8J",
      "Potencia: 220 HP",
      "Altura de descarga: 3.0 m"
    ],
    features: ["Máxima eficiencia", "Sistema OptiShift", "Visibilidad superior", "Bajo impacto ambiental"],
    image: cargadorVolvo,
  },
  {
    title: "Retroexcavadora JCB 3CX",
    shortDesc: "Máquina compacta y multifuncional, excelente para excavación y carga.",
    price: "$280/día",
    specs: [
      "Peso operativo: 8,000 kg",
      "Profundidad de excavación: 5.5 m",
      "Motor: JCB EcoMAX",
      "Potencia: 92 HP",
      "Capacidad de carga: 1.0 m³"
    ],
    features: ["Versatilidad total", "Espacios reducidos", "Fácil transporte", "Operación sencilla"],
    image: retroexcavadoraJcb,
  },
];

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
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 opacity-0 ${machineryVisible ? "animate-fade-in" : ""}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
              NUESTROS EQUIPOS
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Maquinaria de marcas líderes con mantenimiento al día
            </p>
          </div>

          <div ref={machineryRef} className="space-y-16">
            {machinery.map((item, index) => (
              <div 
                key={index}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center opacity-0 ${
                  machineryVisible ? "animate-fade-in-up" : ""
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-heading font-bold">
                      {item.price}
                    </div>
                  </div>
                </div>
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">{item.shortDesc}</p>
                  <h4 className="text-lg font-heading font-semibold text-foreground mb-2">Especificaciones Técnicas</h4>
                  <ul className="text-muted-foreground mb-6 space-y-1">
                    {item.specs.map((spec, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {spec}
                      </li>
                    ))}
                  </ul>
                  <h4 className="text-lg font-heading font-semibold text-foreground mb-3">Características</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {item.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1 rounded-full">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={scrollToContact}
                    className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
                  >
                    SOLICITAR COTIZACIÓN
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
              Garantizamos equipos en óptimas condiciones y soporte técnico profesional
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
