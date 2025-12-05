import { Building2, Home, Wrench, Truck, Settings, Phone, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("INICIO");
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "home", label: "INICIO", icon: Home, path: "/" },
    { id: "construccion", label: "CONSTRUCCIÓN", icon: Building2, path: "/construccion" },
    { id: "ingenieria", label: "INGENIERÍA", icon: Wrench, path: "/ingenieria" },
    { id: "vehiculos", label: "VEHÍCULOS", icon: Truck, path: "/vehiculos" },
    { id: "maquinaria", label: "MAQUINARIA", icon: Settings, path: "/maquinaria" },
    { id: "contact", label: "CONTACTO", icon: Phone, path: "/#contact" },
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
      navigate("/");
      setActiveSection("INICIO");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Section navigation (contact)
    if (location.pathname !== "/") {
      navigate(item.path);
      return;
    }

    const element = document.getElementById(item.id);
    element?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(item.label);
  };

  // Set active based on current route
  useEffect(() => {
    const routeMap: Record<string, string> = {
      "/": "INICIO",
      "/construccion": "CONSTRUCCIÓN",
      "/ingenieria": "INGENIERÍA",
      "/vehiculos": "VEHÍCULOS",
      "/maquinaria": "MAQUINARIA",
    };
    
    if (routeMap[location.pathname]) {
      setActiveSection(routeMap[location.pathname]);
    }
  }, [location.pathname]);

  return (
    <nav className="fixed top-0 w-full bg-secondary z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 bg-primary px-4 py-2 -ml-4 cursor-pointer"
            onClick={() => {
              navigate("/");
              setActiveSection("INICIO");
            }}
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-primary-foreground" />
            <span className="text-xl font-heading font-bold text-primary-foreground tracking-wider">ALEKSEY</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1 relative">
            {navItems.map((item, index) => (
              <button
                key={`${item.label}-${index}`}
                onClick={() => handleNavClick(item)}
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
                onClick={() => handleNavClick(item)}
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
