import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Contact = () => {
  const { toast } = useToast();
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation(0.1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mensaje enviado",
      description: "Nos pondremos en contacto contigo pronto.",
    });
  };

  const contactCards = [
    { icon: Phone, title: "Teléfono", content: "+34 123 456 789" },
    { icon: Mail, title: "Email", content: "info@aleksey.com" },
    { icon: MapPin, title: "Dirección", content: "Calle Principal 123\nMadrid, España" },
  ];

  return (
    <section id="contact" className="py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div 
          ref={titleRef}
          className={`text-center mb-16 opacity-0 ${titleVisible ? "animate-fade-in" : ""}`}
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
            CONTÁCTANOS
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Estamos listos para hacer realidad tu próximo proyecto
          </p>
        </div>

        <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="space-y-6">
            {contactCards.map((card, index) => (
              <Card 
                key={index}
                className={`border-0 bg-card shadow-lg opacity-0 ${contentVisible ? "animate-fade-in-left" : ""}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground mb-1 tracking-wide">
                      {card.title}
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line">{card.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card 
            className={`lg:col-span-2 border-0 bg-card shadow-lg opacity-0 ${contentVisible ? "animate-fade-in-right" : ""}`}
            style={{ animationDelay: "0.2s" }}
          >
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Nombre
                    </label>
                    <Input id="name" placeholder="Tu nombre" required className="bg-muted border-0" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input id="email" type="email" placeholder="tu@email.com" required className="bg-muted border-0" />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Teléfono
                  </label>
                  <Input id="phone" type="tel" placeholder="+34 123 456 789" className="bg-muted border-0" />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Mensaje
                  </label>
                  <Textarea id="message" placeholder="Cuéntanos sobre tu proyecto..." rows={5} required className="bg-muted border-0" />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
                >
                  ENVIAR MENSAJE
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;
