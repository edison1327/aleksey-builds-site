import { Building2, Home, Wrench, Truck, Settings, Phone, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("INICIO");
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "home", label: "INICIO", icon: Home, path: "/", scrollId: "home" },
    { id: "construccion", label: "CONSTRUCCIÓN", icon: Building2, path: "/construccion", scrollId: "services" },
    { id: "ingenieria", label: "INGENIERÍA", icon: Wrench, path: "/ingenieria", scrollId: "services" },
    { id: "vehiculos", label: "VEHÍCULOS", icon: Truck, path: "/vehiculos", scrollId: "vehicles" },
    { id: "maquinaria", label: "MAQUINARIA", icon: Settings, path: "/maquinaria", scrollId: "machinery" },
    { id: "contact", label: "CONTACTO", icon: Phone, path: "/#contact", scrollId: "contact" },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    setIsOpen(false);
    
    // Direct page navigation
    if (["/construccion", "/ingenieria", "/vehiculos", "/maquinaria"].includes(item.path)) {
      navigate(item.path);
      setActiveSection(item.label);
      return;
    }

    // Home page navigation
    if (item.path === "/") {
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/");
      }
      setActiveSection("INICIO");
      return;
    }

    // Section navigation (contact)
    if (location.pathname !== "/") {
      navigate(item.path);
      return;
    }

    const element = document.getElementById(item.scrollId);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  // Track scroll position on home page
  useEffect(() => {
    if (location.pathname !== "/") {
      const routeMap: Record<string, string> = {
        "/construccion": "CONSTRUCCIÓN",
        "/ingenieria": "INGENIERÍA",
        "/vehiculos": "VEHÍCULOS",
        "/maquinaria": "MAQUINARIA",
      };
      if (routeMap[location.pathname]) {
        setActiveSection(routeMap[location.pathname]);
      }
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      const sections = [
        { id: "home", label: "INICIO" },
        { id: "services", label: "CONSTRUCCIÓN" },
        { id: "vehicles", label: "VEHÍCULOS" },
        { id: "machinery", label: "MAQUINARIA" },
        { id: "contact", label: "CONTACTO" },
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          if (scrollPosition >= offsetTop) {
            if (activeSection !== section.label) {
              setActiveSection(section.label);
            }
            break;
          }
        }
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, activeSection]);

  return (
    <nav className="fixed top-0 w-full bg-secondary z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 bg-primary px-4 py-2 -ml-4 cursor-pointer transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
            onClick={() => {
              navigate("/");
              setActiveSection("INICIO");
            }}
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-primary-foreground transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-heading font-bold text-primary-foreground tracking-wider">ALEKSEY</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1 relative">
            {navItems.map((item, index) => (
              <button
                key={`${item.label}-${index}`}
                onClick={() => handleNavClick(item)}
                className={`group relative flex items-center gap-2 px-4 py-2 text-sm font-heading tracking-wide transition-all duration-300 ${
                  activeSection === item.label
                    ? "text-primary-foreground" 
                    : "text-secondary-foreground/80 hover:text-primary-foreground"
                }`}
              >
                <span 
                  className={`absolute inset-0 bg-primary rounded-full transition-all duration-400 ease-out ${
                    activeSection === item.label 
                      ? "opacity-100 scale-100" 
                      : "opacity-0 scale-95 group-hover:opacity-30 group-hover:scale-100"
                  }`}
                  style={{ zIndex: -1 }}
                />
                <item.icon className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
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
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-3 w-full text-left py-2 transition-all duration-300 ${
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
