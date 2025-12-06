import { MessageCircle } from "lucide-react";
import { useContactInfo } from "@/hooks/useSiteData";

const WhatsAppButton = () => {
  const { data: contactInfo } = useContactInfo();
  
  // Extract phone number and format for WhatsApp
  const getWhatsAppLink = () => {
    const phone = contactInfo?.phone || "+51999999999";
    // Remove all non-numeric characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    const message = encodeURIComponent("Hola, me gustaría obtener más información sobre sus servicios.");
    return `https://wa.me/${cleanPhone.replace("+", "")}?text=${message}`;
  };

  return (
    <a
      href={getWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-2 bg-foreground text-background text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        ¿Necesitas ayuda?
      </span>
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
    </a>
  );
};

export default WhatsAppButton;
