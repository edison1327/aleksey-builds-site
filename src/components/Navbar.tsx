import { Building2, Home, Wrench, Truck, Settings, Phone, Menu, X, ChevronDown, Users, FolderKanban } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoAleksey from "@/assets/logo-aleksey.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("INICIO");
  const navigate = useNavigate();
  const location = useLocation();
  const servicesRef = useRef<HTMLDivElement>(null);

  const serviceItems = [
    { id: "construccion", label: "CONSTRUCCIÓN", icon: Building2, path: "/construccion" },
    { id: "ingenieria", label: "INGENIERÍA", icon: Wrench, path: "/ingenieria" },
    { id: "vehiculos", label: "VEHÍCULOS", icon: Truck, path: "/vehiculos" },
    { id: "maquinaria", label: "MAQUINARIA", icon: Settings, path: "/maquinaria" },
  ];

  const handleNavClick = (path: string, label: string) => {
    setIsOpen(false);
    setIsServicesOpen(false);
    
    // Direct page navigation for services
    if (["/construccion", "/ingenieria", "/vehiculos", "/maquinaria", "/nosotros", "/proyectos", "/convocatoria"].includes(path)) {
      navigate(path);
      setActiveSection(label);
      return;
    }

    if (path === "/") {
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/");
      }
      setActiveSection("INICIO");
      return;
    }

    // Section scroll on home page
    if (path === "/#contact" || path === "/#about" || path === "/#projects") {
      const sectionMap: Record<string, string> = {
        "/#contact": "contact",
        "/#about": "about",
        "/#projects": "projects"
      };
      const sectionId = sectionMap[path];
      if (location.pathname !== "/") {
        navigate(path);
        return;
      }
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
      setActiveSection(label);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Track scroll position on home page
  useEffect(() => {
    if (location.pathname !== "/") {
      const routeMap: Record<string, string> = {
        "/construccion": "CONSTRUCCIÓN",
        "/ingenieria": "INGENIERÍA",
        "/vehiculos": "VEHÍCULOS",
        "/maquinaria": "MAQUINARIA",
        "/nosotros": "SOBRE NOSOTROS",
        "/proyectos": "PROYECTOS",
        "/convocatoria": "CONVOCATORIA",
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
        { id: "services", label: "SERVICIOS" },
        { id: "vehicles", label: "SERVICIOS" },
        { id: "machinery", label: "SERVICIOS" },
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

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, activeSection]);

  const isServiceActive = serviceItems.some(item => item.label === activeSection);

  return (
    <nav className="fixed top-0 w-full bg-secondary z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer transition-all duration-300 hover:opacity-80"
            onClick={() => {
              navigate("/");
              setActiveSection("INICIO");
            }}
          >
            <img src={logoAleksey} alt="ALEKSEY - Ingeniería y Construcción" className="h-10 md:h-12" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1 relative">
            {/* INICIO */}
            <button
              onClick={() => handleNavClick("/", "INICIO")}
              className="group relative flex items-center gap-2 px-4 py-2 text-sm font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
            >
              <span 
                className="absolute inset-0 bg-primary rounded-full transition-all duration-400 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                style={{ zIndex: -1 }}
              />
              <Home className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative z-10">INICIO</span>
            </button>

            {/* SOBRE NOSOTROS */}
            <button
              onClick={() => handleNavClick("/nosotros", "SOBRE NOSOTROS")}
              className="group relative flex items-center gap-2 px-4 py-2 text-sm font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
            >
              <span 
                className="absolute inset-0 bg-primary rounded-full transition-all duration-400 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                style={{ zIndex: -1 }}
              />
              <Users className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative z-10">SOBRE NOSOTROS</span>
            </button>

            {/* SERVICIOS Dropdown */}
            <div ref={servicesRef} className="relative">
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                className="group relative flex items-center gap-2 px-4 py-2 text-sm font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
              >
                <span 
                  className="absolute inset-0 bg-primary rounded-full transition-all duration-400 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                  style={{ zIndex: -1 }}
                />
                <Wrench className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                <span className="relative z-10">NUESTROS SERVICIOS</span>
                <ChevronDown className={`h-4 w-4 relative z-10 transition-transform duration-300 ${isServicesOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isServicesOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-secondary border border-secondary-foreground/10 rounded-lg shadow-xl overflow-hidden z-50">
                  {serviceItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.path, item.label)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PROYECTOS */}
            <button
              onClick={() => handleNavClick("/proyectos", "PROYECTOS")}
              className="group relative flex items-center gap-2 px-4 py-2 text-sm font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
            >
              <span 
                className="absolute inset-0 bg-primary rounded-full transition-all duration-400 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                style={{ zIndex: -1 }}
              />
              <FolderKanban className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative z-10">PROYECTOS</span>
            </button>

            {/* CONTACTO */}
            <button
              onClick={() => handleNavClick("/#contact", "CONTACTO")}
              className="group relative flex items-center gap-2 px-4 py-2 text-sm font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
            >
              <span 
                className="absolute inset-0 bg-primary rounded-full transition-all duration-400 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                style={{ zIndex: -1 }}
              />
              <Phone className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative z-10">CONTACTO</span>
            </button>
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
            {/* INICIO */}
            <button
              onClick={() => handleNavClick("/", "INICIO")}
              className={`flex items-center gap-3 w-full text-left py-2 transition-all duration-300 ${
                activeSection === "INICIO"
                  ? "text-primary font-bold"
                  : "text-secondary-foreground/80 hover:text-primary-foreground"
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="font-heading tracking-wide">INICIO</span>
            </button>

            {/* SOBRE NOSOTROS */}
            <button
              onClick={() => handleNavClick("/nosotros", "SOBRE NOSOTROS")}
              className={`flex items-center gap-3 w-full text-left py-2 transition-all duration-300 ${
                activeSection === "SOBRE NOSOTROS"
                  ? "text-primary font-bold"
                  : "text-secondary-foreground/80 hover:text-primary-foreground"
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-heading tracking-wide">SOBRE NOSOTROS</span>
            </button>

            {/* SERVICIOS Accordion */}
            <div>
              <button
                onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                className={`flex items-center justify-between w-full text-left py-2 transition-all duration-300 ${
                  isServiceActive
                    ? "text-primary font-bold"
                    : "text-secondary-foreground/80 hover:text-primary-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5" />
                  <span className="font-heading tracking-wide">NUESTROS SERVICIOS</span>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isMobileServicesOpen ? "rotate-180" : ""}`} />
              </button>

              {isMobileServicesOpen && (
                <div className="pl-8 space-y-1 mt-2">
                  {serviceItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.path, item.label)}
                      className={`flex items-center gap-3 w-full text-left py-2 transition-all duration-300 ${
                        activeSection === item.label
                          ? "text-primary font-bold"
                          : "text-secondary-foreground/80 hover:text-primary-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-heading tracking-wide text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PROYECTOS */}
            <button
              onClick={() => handleNavClick("/proyectos", "PROYECTOS")}
              className={`flex items-center gap-3 w-full text-left py-2 transition-all duration-300 ${
                activeSection === "PROYECTOS"
                  ? "text-primary font-bold"
                  : "text-secondary-foreground/80 hover:text-primary-foreground"
              }`}
            >
              <FolderKanban className="h-5 w-5" />
              <span className="font-heading tracking-wide">PROYECTOS</span>
            </button>

            {/* CONTACTO */}
            <button
              onClick={() => handleNavClick("/#contact", "CONTACTO")}
              className={`flex items-center gap-3 w-full text-left py-2 transition-all duration-300 ${
                activeSection === "CONTACTO"
                  ? "text-primary font-bold"
                  : "text-secondary-foreground/80 hover:text-primary-foreground"
              }`}
            >
              <Phone className="h-5 w-5" />
              <span className="font-heading tracking-wide">CONTACTO</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
