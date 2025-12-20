import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { useContactInfo } from "@/hooks/useSiteData";

const WhatsAppButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasShownTooltip, setHasShownTooltip] = useState(false);
  const { data: contactInfo } = useContactInfo();

  useEffect(() => {
    // Show button after scroll
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
        
        // Show tooltip once after button appears
        if (!hasShownTooltip) {
          setTimeout(() => {
            setShowTooltip(true);
            setHasShownTooltip(true);
            
            // Hide tooltip after 5 seconds
            setTimeout(() => {
              setShowTooltip(false);
            }, 5000);
          }, 2000);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasShownTooltip]);

  const handleClick = () => {
    // Clean phone number for WhatsApp
    const phone = contactInfo?.phone?.replace(/[^0-9+]/g, "") || "+51968140319";
    const cleanPhone = phone.replace("+", "");
    
    const message = encodeURIComponent(
      "¡Hola! Me gustaría obtener más información sobre sus servicios de construcción e ingeniería."
    );
    
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip */}
      {showTooltip && (
        <div className="relative animate-fade-in">
          <div className="bg-card text-card-foreground px-4 py-3 rounded-2xl shadow-2xl border border-border/50 max-w-[200px]">
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute -top-2 -right-2 bg-muted rounded-full p-1 hover:bg-muted-foreground/20 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="text-sm font-medium">¿Necesitas ayuda?</p>
            <p className="text-xs text-muted-foreground mt-1">
              Escríbenos por WhatsApp
            </p>
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-b border-r border-border/50 rotate-45 transform" />
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={handleClick}
        className="group relative bg-[#25D366] hover:bg-[#20BA5C] text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(37,211,102,0.5)]"
        aria-label="Contactar por WhatsApp"
      >
        {/* Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse opacity-40" />
        
        {/* Icon */}
        <MessageCircle className="h-7 w-7 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
        
        {/* Notification Dot */}
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce" />
      </button>
    </div>
  );
};

export default WhatsAppButton;
