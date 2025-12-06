import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";

const quoteSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
  email: z.string().trim().email("Email inválido").max(255, "El email es muy largo"),
  phone: z.string().trim().max(20, "El teléfono es muy largo").optional(),
  message: z.string().trim().max(1000, "El mensaje es muy largo").optional(),
});

interface QuickQuoteFormProps {
  itemName: string;
  itemType: "vehículo" | "maquinaria" | "servicio";
  onSuccess?: () => void;
}

const QuickQuoteForm = ({ itemName, itemType, onSuccess }: QuickQuoteFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = quoteSchema.safeParse(formData);
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
      const fullMessage = `[Cotización de ${itemType}: ${itemName}]\n\n${formData.message || "Solicito información y cotización."}`;

      // Save to database
      const { error } = await supabase.from("contact_messages").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        message: fullMessage,
      });

      if (error) throw error;

      // Send email notification (don't fail if email fails)
      try {
        await supabase.functions.invoke("send-quote-notification", {
          body: {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone?.trim() || null,
            message: fullMessage,
            itemName,
            itemType,
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      toast({
        title: "¡Solicitud enviada!",
        description: "Nos pondremos en contacto contigo pronto.",
      });

      setFormData({ name: "", email: "", phone: "", message: "" });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4 mt-4">
      <h4 className="font-heading font-semibold text-foreground">Solicitar Cotización</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quote-name">Nombre *</Label>
          <Input
            id="quote-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Tu nombre"
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quote-email">Email *</Label>
          <Input
            id="quote-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="tu@email.com"
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quote-phone">Teléfono</Label>
        <Input
          id="quote-phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+51 999 999 999"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quote-message">Mensaje (opcional)</Label>
        <Textarea
          id="quote-message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Cuéntanos más sobre tu proyecto o necesidades..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Enviar Solicitud
          </>
        )}
      </Button>
    </form>
  );
};

export default QuickQuoteForm;
