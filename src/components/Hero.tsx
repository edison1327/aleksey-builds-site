import { Building2, Wrench, Truck, Settings } from "lucide-react";
import { Button } from "./ui/button";

const services = [
  { icon: Building2, title: "CONSTRUCCIÓN", desc: "Proyectos residenciales y comerciales" },
  { icon: Wrench, title: "INGENIERÍA", desc: "Soluciones técnicas especializadas" },
  { icon: Truck, title: "VEHÍCULOS", desc: "Alquiler de vehículos comerciales" },
  { icon: Settings, title: "MAQUINARIA", desc: "Equipos pesados para construcción" },
];

const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToServices = () => {
    const element = document.getElementById("services");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16">
      {/* Split Background */}
      <div className="absolute inset-0 flex">
        <div className="w-full lg:w-1/2 bg-secondary" />
        <div className="hidden lg:block w-1/2 bg-muted" />
      </div>

      {/* Decorative Circle */}
      <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-foreground/10 rounded-full" style={{ right: 'calc(50% - 300px)' }} />

      <div className="container mx-auto px-4 z-10 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-secondary-foreground">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight mb-4 animate-fade-in">
              ALEKSEY
            </h1>
            <h2 className="text-2xl md:text-3xl font-heading font-medium tracking-widest text-primary mb-8 animate-fade-in">
              CONSTRUCCIÓN & INGENIERÍA
            </h2>
            <p className="text-lg md:text-xl text-secondary-foreground/80 mb-10 max-w-lg animate-fade-in leading-relaxed">
              Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada. 
              Más de una década transformando proyectos en realidad.
            </p>
            <Button
              size="lg"
              onClick={scrollToContact}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider px-8 py-6 text-base animate-fade-in"
            >
              CONTACTAR AHORA
            </Button>
          </div>

          {/* Right Content - Services Card */}
          <div className="lg:pl-12">
            <div className="bg-card rounded-2xl shadow-2xl p-8 animate-fade-in">
              <h3 className="text-xl font-heading font-bold text-foreground mb-6 tracking-wide">
                SERVICIOS PRINCIPALES
              </h3>
              
              <div className="space-y-5">
                {services.map((service, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <service.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-foreground tracking-wide">
                        {service.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={scrollToServices}
                className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
              >
                VER TODOS LOS SERVICIOS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
