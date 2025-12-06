import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useContactInfo } from "@/hooks/useSiteData";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Default contact info
const defaultContact = {
  phone: "+58 414 123 4567",
  email: "info@aleksey.com",
  address: "Av. Principal 123\nCiudad Capital, Venezuela",
};

const contactSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().optional(),
  message: z.string().trim().min(1, "El mensaje es requerido").max(1000),
});

const Contact = () => {
  const { toast } = useToast();
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation(0.1);
  const { data: contactInfo } = useContactInfo();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use database contact info or defaults
  const phone = contactInfo?.phone || defaultContact.phone;
  const email = contactInfo?.email || defaultContact.email;
  const address = contactInfo?.address 
    ? `${contactInfo.address}${contactInfo.city ? `\n${contactInfo.city}` : ""}${contactInfo.country ? `, ${contactInfo.country}` : ""}`
    : defaultContact.address;

  const contactCards = [
    { icon: Phone, title: "Teléfono", content: phone },
    { icon: Mail, title: "Email", content: email },
    { icon: MapPin, title: "Dirección", content: address },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          message: formData.message.trim(),
        });
      
      if (error) throw error;
      
      toast({
        title: "Mensaje enviado",
        description: "Nos pondremos en contacto contigo pronto.",
      });
      
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    <Input 
                      id="name" 
                      placeholder="Tu nombre" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`bg-muted border-0 ${errors.name ? "ring-2 ring-destructive" : ""}`}
                      required 
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="tu@email.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`bg-muted border-0 ${errors.email ? "ring-2 ring-destructive" : ""}`}
                      required 
                    />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Teléfono
                  </label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+58 414 123 4567" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-muted border-0" 
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Mensaje
                  </label>
                  <Textarea 
                    id="message" 
                    placeholder="Cuéntanos sobre tu proyecto..." 
                    rows={5} 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`bg-muted border-0 ${errors.message ? "ring-2 ring-destructive" : ""}`}
                    required 
                  />
                  {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
                >
                  {isSubmitting ? "ENVIANDO..." : "ENVIAR MENSAJE"}
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
