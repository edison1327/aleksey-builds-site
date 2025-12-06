import { Building2, Home, Wrench, Truck, Settings, Phone, Menu, X, ChevronDown, Users, FolderKanban } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoAlekseyFallback from "@/assets/logo-aleksey.png";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("INICIO");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const servicesRef = useRef<HTMLDivElement>(null);
  const { data: siteSettings } = useSiteSettings();

  const logoUrl = siteSettings?.logo_url || logoAlekseyFallback;
  const companyName = siteSettings?.company_name || "ALEKSEY";

  const serviceItems = [
    { id: "construccion", label: "CONSTRUCCIÓN", icon: Building2, path: "/construccion" },
    { id: "ingenieria", label: "INGENIERÍA", icon: Wrench, path: "/ingenieria" },
    { id: "vehiculos", label: "VEHÍCULOS", icon: Truck, path: "/vehiculos" },
    { id: "maquinaria", label: "MAQUINARIA", icon: Settings, path: "/maquinaria" },
  ];

  const handleNavClick = (path: string, label: string) => {
    setIsOpen(false);
    setIsServicesOpen(false);
    
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

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setIsMobileServicesOpen(false);
  }, [location.pathname]);

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
    <nav className={cn(
      "fixed top-0 w-full bg-secondary z-50 transition-all duration-300",
      scrolled ? "shadow-lg backdrop-blur-md bg-secondary/95" : "backdrop-blur-sm"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer transition-all duration-300 hover:opacity-80 shrink-0"
            onClick={() => {
              navigate("/");
              setActiveSection("INICIO");
            }}
          >
            <img 
              src={logoUrl} 
              alt={`${companyName} - Ingeniería y Construcción`} 
              className="h-8 sm:h-10 md:h-12" 
            />
          </div>

          {/* Desktop Menu - hidden on mobile and tablet */}
          <div className="hidden xl:flex items-center gap-1 relative">
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

              {isServicesOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-secondary border border-secondary-foreground/10 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in">
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
            className="xl:hidden text-secondary-foreground p-2 hover:bg-secondary-foreground/10 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu - fullscreen overlay */}
        <div className={cn(
          "xl:hidden fixed inset-x-0 top-14 sm:top-16 bottom-0 bg-secondary/98 backdrop-blur-md transition-all duration-300 overflow-auto",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}>
          <div className="container mx-auto px-4 py-6 space-y-2">
            {/* INICIO */}
            <button
              onClick={() => handleNavClick("/", "INICIO")}
              className={cn(
                "flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl transition-all duration-300",
                activeSection === "INICIO"
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground/80 hover:bg-secondary-foreground/10"
              )}
            >
              <Home className="h-5 w-5" />
              <span className="font-heading tracking-wide text-base">INICIO</span>
            </button>

            {/* SOBRE NOSOTROS */}
            <button
              onClick={() => handleNavClick("/nosotros", "SOBRE NOSOTROS")}
              className={cn(
                "flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl transition-all duration-300",
                activeSection === "SOBRE NOSOTROS"
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground/80 hover:bg-secondary-foreground/10"
              )}
            >
              <Users className="h-5 w-5" />
              <span className="font-heading tracking-wide text-base">SOBRE NOSOTROS</span>
            </button>

            {/* SERVICIOS Accordion */}
            <div className="space-y-1">
              <button
                onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                className={cn(
                  "flex items-center justify-between w-full text-left py-3 px-4 rounded-xl transition-all duration-300",
                  isServiceActive
                    ? "bg-primary text-primary-foreground"
                    : "text-secondary-foreground/80 hover:bg-secondary-foreground/10"
                )}
              >
                <div className="flex items-center gap-4">
                  <Wrench className="h-5 w-5" />
                  <span className="font-heading tracking-wide text-base">NUESTROS SERVICIOS</span>
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isMobileServicesOpen ? "rotate-180" : ""
                )} />
              </button>

              <div className={cn(
                "overflow-hidden transition-all duration-300",
                isMobileServicesOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="pl-4 space-y-1 pt-2">
                  {serviceItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.path, item.label)}
                      className={cn(
                        "flex items-center gap-4 w-full text-left py-2.5 px-4 rounded-xl transition-all duration-300",
                        activeSection === item.label
                          ? "bg-primary/80 text-primary-foreground"
                          : "text-secondary-foreground/70 hover:bg-secondary-foreground/10"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-heading tracking-wide text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PROYECTOS */}
            <button
              onClick={() => handleNavClick("/proyectos", "PROYECTOS")}
              className={cn(
                "flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl transition-all duration-300",
                activeSection === "PROYECTOS"
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground/80 hover:bg-secondary-foreground/10"
              )}
            >
              <FolderKanban className="h-5 w-5" />
              <span className="font-heading tracking-wide text-base">PROYECTOS</span>
            </button>

            {/* CONTACTO */}
            <button
              onClick={() => handleNavClick("/#contact", "CONTACTO")}
              className={cn(
                "flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl transition-all duration-300",
                activeSection === "CONTACTO"
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground/80 hover:bg-secondary-foreground/10"
              )}
            >
              <Phone className="h-5 w-5" />
              <span className="font-heading tracking-wide text-base">CONTACTO</span>
            </button>

            {/* Divider */}
            <div className="pt-4 border-t border-secondary-foreground/10 mt-4">
              <p className="text-xs text-secondary-foreground/50 px-4 mb-3">
                {siteSettings?.tagline || "Ingeniería y Construcción"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
