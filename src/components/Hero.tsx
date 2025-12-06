import { Building2, Wrench, Truck, Settings, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useParallax } from "@/hooks/useParallax";
import { useCountUp } from "@/hooks/useCountUp";
import { useTypewriter } from "@/hooks/useTypewriter";
import heroImage from "@/assets/hero-construction.jpg";

// Video de construcción de Pexels (libre de derechos)
const HERO_VIDEO_URL = "https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4";

const services = [
  { icon: Building2, title: "CONSTRUCCIÓN", desc: "Proyectos residenciales y comerciales" },
  { icon: Wrench, title: "INGENIERÍA", desc: "Soluciones técnicas especializadas" },
  { icon: Truck, title: "VEHÍCULOS", desc: "Alquiler de vehículos comerciales" },
  { icon: Settings, title: "MAQUINARIA", desc: "Equipos pesados para construcción" },
];

const Hero = () => {
  const parallaxOffset = useParallax(0.1);
  
  // Animated counters
  const projectsCount = useCountUp({ end: 150, duration: 2000, delay: 800, suffix: "+" });
  const yearsCount = useCountUp({ end: 10, duration: 1500, delay: 1000, suffix: "+" });
  const clientsCount = useCountUp({ end: 98, duration: 2000, delay: 1200, suffix: "%" });

  // Typewriter effect for subtitle
  const { displayText, isTyping } = useTypewriter({
    text: "INGENIERÍA Y CONSTRUCCIÓN",
    speed: 60,
    delay: 400,
  });

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToServices = () => {
    const element = document.getElementById("services");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Full Background Video with Overlay */}
      <div 
        className="absolute inset-0 w-full h-[120%] -top-[10%]"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={heroImage}
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
        {/* Fallback Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/95 to-secondary/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-transparent to-secondary/40" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Geometric Lines */}
        <div className="absolute top-20 left-10 w-px h-32 bg-gradient-to-b from-primary/50 to-transparent" />
        <div className="absolute top-20 left-10 w-32 h-px bg-gradient-to-r from-primary/50 to-transparent" />
        
        <div className="absolute bottom-20 right-10 w-px h-32 bg-gradient-to-t from-primary/50 to-transparent" />
        <div className="absolute bottom-20 right-10 w-32 h-px bg-gradient-to-l from-primary/50 to-transparent" />

        {/* Floating Circles */}
        <div 
          className="hidden lg:block absolute right-[15%] top-[20%] w-72 h-72 border border-primary/20 rounded-full"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        />
        <div 
          className="hidden lg:block absolute right-[20%] top-[30%] w-48 h-48 border border-secondary-foreground/10 rounded-full"
          style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" 
          style={{
            backgroundImage: `linear-gradient(hsl(var(--secondary-foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--secondary-foreground)) 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 z-10 relative pt-24 pb-16">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Content - 7 columns */}
          <div className="lg:col-span-7 text-secondary-foreground">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-stagger-1"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary tracking-wider">MÁS DE 10 AÑOS DE EXPERIENCIA</span>
            </div>

            <h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight mb-2 animate-stagger-2"
            >
              <span className="text-secondary-foreground">ALEKSEY</span>
            </h1>
            
            <div 
              className="flex items-center gap-4 mb-6 animate-stagger-3"
            >
              <div className="h-1 w-16 bg-primary rounded-full" />
              <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-medium tracking-[0.2em] text-primary">
                {displayText}
                <span className={`inline-block w-0.5 h-6 md:h-8 bg-primary ml-1 ${isTyping ? "animate-pulse" : "opacity-0"}`} />
              </h2>
            </div>

            <p 
              className="text-base md:text-lg text-secondary-foreground/80 mb-10 max-w-xl animate-stagger-4 leading-relaxed"
            >
              Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada. 
              Transformamos proyectos ambiciosos en realidades sólidas con calidad garantizada.
            </p>

            {/* CTA Buttons */}
            <div 
              className="flex flex-wrap gap-4 animate-stagger-5"
            >
              <Button
                size="lg"
                onClick={scrollToContact}
                className="group bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider px-8 py-6 text-base"
              >
                SOLICITAR COTIZACIÓN
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToServices}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-heading tracking-wider px-8 py-6 text-base"
              >
                EXPLORAR SERVICIOS
              </Button>
            </div>

            {/* Stats */}
            <div 
              className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-secondary-foreground/10 animate-stagger-6"
            >
              <div ref={projectsCount.ref}>
                <div className="text-3xl md:text-4xl font-heading font-bold text-primary">{projectsCount.display}</div>
                <div className="text-sm text-secondary-foreground/70 mt-1">Proyectos Completados</div>
              </div>
              <div ref={yearsCount.ref}>
                <div className="text-3xl md:text-4xl font-heading font-bold text-primary">{yearsCount.display}</div>
                <div className="text-sm text-secondary-foreground/70 mt-1">Años de Experiencia</div>
              </div>
              <div ref={clientsCount.ref}>
                <div className="text-3xl md:text-4xl font-heading font-bold text-primary">{clientsCount.display}</div>
                <div className="text-sm text-secondary-foreground/70 mt-1">Clientes Satisfechos</div>
              </div>
            </div>
          </div>

          {/* Right Content - Services Card - 5 columns */}
          <div 
            className="lg:col-span-5 animate-slide-in-right"
          >
            <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 border border-border/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-heading font-bold text-foreground tracking-wide">
                  SERVICIOS PRINCIPALES
                </h3>
              </div>
              
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div 
                    key={index} 
                    className="group flex items-center gap-4 p-3 rounded-xl transition-all duration-300 hover:bg-muted cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary group-hover:scale-105">
                      <service.icon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-heading font-semibold text-foreground tracking-wide text-sm">
                        {service.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">{service.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                  </div>
                ))}
              </div>

              <Button
                onClick={scrollToServices}
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
              >
                VER TODOS LOS SERVICIOS
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <button 
          onClick={scrollToServices}
          className="flex flex-col items-center gap-2 text-secondary-foreground/60 hover:text-secondary-foreground transition-colors"
        >
          <span className="text-xs tracking-widest font-heading">SCROLL</span>
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};

export default Hero;
