import { Building2, Home, Wrench, Truck, Settings, Phone, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  const navItems = [
    { id: "home", label: "INICIO", icon: Home },
    { id: "services", label: "CONSTRUCCIÓN", icon: Building2 },
    { id: "services", label: "INGENIERÍA", icon: Wrench },
    { id: "vehicles", label: "VEHÍCULOS", icon: Truck },
    { id: "machinery", label: "MAQUINARIA", icon: Settings },
    { id: "contact", label: "CONTACTO", icon: Phone },
  ];

  return (
    <nav className="fixed top-0 w-full bg-secondary z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 bg-primary px-4 py-2 -ml-4">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-primary-foreground" />
            <span className="text-xl font-heading font-bold text-primary-foreground tracking-wider">ALEKSEY</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                onClick={() => scrollToSection(item.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-heading tracking-wide transition-colors ${
                  index === 0 
                    ? "bg-primary text-primary-foreground rounded-full" 
                    : "text-secondary-foreground/80 hover:text-primary-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-secondary-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 space-y-2 border-t border-secondary-foreground/10">
            {navItems.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                onClick={() => scrollToSection(item.id)}
                className="flex items-center gap-3 w-full text-left text-secondary-foreground/80 hover:text-primary-foreground transition-colors py-2"
              >
                <item.icon className="h-5 w-5" />
                <span className="font-heading tracking-wide">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
