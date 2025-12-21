import { useState, useEffect, useCallback } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useTestimonials, useHeroContent } from "@/hooks/useSiteData";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar_url?: string | null;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Carlos Mendoza",
    role: "Gerente de Proyectos",
    company: "Constructora Lima SAC",
    content: "Excelente servicio y profesionalismo. El equipo de ALEKSEY cumplió con todos los plazos establecidos y la calidad del trabajo superó nuestras expectativas. Definitivamente los recomendaría.",
    rating: 5,
  },
  {
    id: "2",
    name: "María García",
    role: "Directora de Operaciones",
    company: "Inmobiliaria del Sur",
    content: "La maquinaria que alquilamos estaba en perfectas condiciones y el soporte técnico fue excepcional. Han sido nuestros aliados en múltiples proyectos residenciales.",
    rating: 5,
  },
  {
    id: "3",
    name: "Roberto Sánchez",
    role: "Ingeniero Civil",
    company: "Proyectos Andinos",
    content: "Profesionales de primera. Su experiencia en ingeniería geotécnica nos ayudó a resolver problemas complejos de cimentación. Un equipo confiable y competente.",
    rating: 5,
  },
];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    "from-primary to-primary/70",
    "from-amber-500 to-amber-600",
    "from-emerald-500 to-emerald-600",
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const TestimonialsStats = () => {
  const { data: heroData } = useHeroContent();

  const stats = [
    { value: `${heroData?.clients_percentage || 98}%`, label: "Clientes Satisfechos" },
    { value: `${heroData?.projects_count || 150}+`, label: "Proyectos Completados" },
    { value: `${heroData?.years_count || 10}+`, label: "Años de Experiencia" },
  ];

  return (
    <div className="grid grid-cols-3 gap-6 mt-16">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300 group"
        >
          <div className="text-3xl md:text-4xl font-heading font-bold text-primary group-hover:scale-110 transition-transform duration-300">
            {stat.value}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const Testimonials = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { data: dbTestimonials, isLoading } = useTestimonials();
  
  // Use database testimonials if available, otherwise use defaults
  const testimonials = dbTestimonials.length > 0 ? dbTestimonials : defaultTestimonials;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "start",
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center">
              <Quote className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground tracking-wide">
              TESTIMONIOS
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lo que dicen nuestros clientes sobre nuestra experiencia trabajando juntos
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300 -translate-x-4 md:translate-x-0 shadow-lg"
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300 translate-x-4 md:translate-x-0 shadow-lg"
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Carousel Container */}
          <div className="overflow-hidden mx-8 md:mx-12" ref={emblaRef}>
            <div className="flex gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                >
                  <Card className="h-full bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
                    {/* Decorative gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
                    
                    <CardContent className="p-6 md:p-8 flex flex-col h-full">
                      {/* Quote Icon */}
                      <div className="mb-4">
                        <Quote className="h-8 w-8 text-primary/20 group-hover:text-primary/40 transition-colors duration-300" />
                      </div>

                      {/* Content */}
                      <p className="text-muted-foreground leading-relaxed mb-6 flex-grow text-sm md:text-base">
                        "{testimonial.content}"
                      </p>

                      {/* Rating */}
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 transition-all duration-300 ${
                              i < testimonial.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                            style={{ 
                              transitionDelay: `${i * 50}ms`,
                              transform: i < testimonial.rating ? "scale(1)" : "scale(0.9)"
                            }}
                          />
                        ))}
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                        {/* Avatar */}
                        <div 
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(testimonial.name)} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          {testimonial.avatar_url ? (
                            <img 
                              src={testimonial.avatar_url} 
                              alt={testimonial.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(testimonial.name)
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading font-bold text-foreground truncate">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {testimonial.role}
                          </p>
                          <p className="text-xs text-primary font-medium truncate">
                            {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? "bg-primary w-8"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Ir al testimonio ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <TestimonialsStats />
      </div>
    </section>
  );
};

export default Testimonials;
