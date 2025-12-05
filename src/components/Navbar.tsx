import { Building2, Home, Wrench, Truck, Settings, Phone, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const navItems = [
    { id: "home", label: "INICIO", icon: Home },
    { id: "services", label: "CONSTRUCCIÓN", icon: Building2 },
    { id: "services", label: "INGENIERÍA", icon: Wrench },
    { id: "vehicles", label: "VEHÍCULOS", icon: Truck },
    { id: "machinery", label: "MAQUINARIA", icon: Settings },
    { id: "contact", label: "CONTACTO", icon: Phone },
  ];

  const scrollToSection = (id: string, label: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(label);
    setIsOpen(false);
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "services", "vehicles", "machinery", "contact"];
      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            const item = navItems.find(nav => nav.id === sectionId);
            if (item && activeSection !== item.label) {
              setActiveSection(item.label);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeSection]);

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
          <div className="hidden lg:flex items-center gap-1 relative">
            {navItems.map((item, index) => (
              <button
                key={`${item.label}-${index}`}
                onClick={() => scrollToSection(item.id, item.label)}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-heading tracking-wide transition-colors duration-300 ${
                  activeSection === item.label
                    ? "text-primary-foreground" 
                    : "text-secondary-foreground/80 hover:text-primary-foreground"
                }`}
              >
                {activeSection === item.label && (
                  <span 
                    className="absolute inset-0 bg-primary rounded-full animate-fade-in"
                    style={{ 
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      zIndex: -1 
                    }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
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
                key={`${item.label}-${index}`}
                onClick={() => scrollToSection(item.id, item.label)}
                className={`flex items-center gap-3 w-full text-left py-2 transition-colors ${
                  activeSection === item.label
                    ? "text-primary font-bold"
                    : "text-secondary-foreground/80 hover:text-primary-foreground"
                }`}
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
