import { Building2, Home, Wrench, Truck, Settings, Phone, Menu, X, ChevronDown, Users, FolderKanban, Sparkles } from "lucide-react";
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

  const mobileMenuItems = [
    { id: "inicio", label: "INICIO", icon: Home, path: "/", section: "INICIO" },
    { id: "nosotros", label: "SOBRE NOSOTROS", icon: Users, path: "/nosotros", section: "SOBRE NOSOTROS" },
  ];

  const bottomMenuItems = [
    { id: "proyectos", label: "PROYECTOS", icon: FolderKanban, path: "/proyectos", section: "PROYECTOS" },
    { id: "contacto", label: "CONTACTO", icon: Phone, path: "/#contact", section: "CONTACTO" },
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
    <>
      {/* Main Navigation Bar */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 bg-secondary z-[100] transition-all duration-300",
        scrolled ? "shadow-2xl shadow-black/20 backdrop-blur-md bg-secondary/95 border-b border-primary/20" : "backdrop-blur-sm"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer transition-all duration-300 hover:opacity-80 shrink-0"
              onClick={() => {
                navigate("/");
                setActiveSection("INICIO");
                setIsOpen(false);
              }}
            >
              <img 
                src={logoUrl} 
                alt={`${companyName} - Ingeniería y Construcción`} 
                className="h-8 sm:h-10 md:h-12" 
              />
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1 relative">
              {/* INICIO */}
              <button
                onClick={() => handleNavClick("/", "INICIO")}
                className="group relative flex items-center gap-2 px-4 py-2 text-base font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
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
                className="group relative flex items-center gap-2 px-4 py-2 text-base font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
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
                  className="group relative flex items-center gap-2 px-4 py-2 text-base font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
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
                  <div className="absolute top-full left-0 mt-2 w-56 bg-secondary border border-secondary-foreground/10 rounded-lg shadow-xl overflow-hidden z-[110] animate-fade-in">
                    {serviceItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.path, item.label)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-base font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground"
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
                className="group relative flex items-center gap-2 px-4 py-2 text-base font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
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
                className="group relative flex items-center gap-2 px-4 py-2 text-base font-heading tracking-wide transition-all duration-300 text-secondary-foreground/80 hover:text-primary-foreground"
              >
                <span 
                  className="absolute inset-0 bg-primary rounded-full transition-all duration-400 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                  style={{ zIndex: -1 }}
                />
                <Phone className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                <span className="relative z-10">CONTACTO</span>
              </button>
            </div>

            {/* Animated Hamburger Button */}
            <button
              className="lg:hidden relative flex items-center justify-center w-12 h-12 text-secondary-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all duration-300"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <div className="relative w-6 h-5 flex flex-col justify-between">
                <span className={cn(
                  "block h-0.5 w-6 bg-current rounded-full transition-all duration-300 origin-center",
                  isOpen ? "rotate-45 translate-y-2" : ""
                )} />
                <span className={cn(
                  "block h-0.5 w-6 bg-current rounded-full transition-all duration-300",
                  isOpen ? "opacity-0 scale-0" : "opacity-100"
                )} />
                <span className={cn(
                  "block h-0.5 w-6 bg-current rounded-full transition-all duration-300 origin-center",
                  isOpen ? "-rotate-45 -translate-y-2" : ""
                )} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 z-[99] transition-all duration-500",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 backdrop-blur-sm" />
      </div>

      {/* Mobile Menu Panel */}
      <div className={cn(
        "lg:hidden fixed top-14 sm:top-16 left-0 right-0 bottom-0 z-[101] transition-all duration-500 ease-out overflow-hidden",
        isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      )}>
        {/* Animated Background */}
        <div className={cn(
          "absolute inset-0 bg-secondary transition-transform duration-500 ease-out",
          isOpen ? "translate-y-0" : "-translate-y-full"
        )}>
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          
          {/* Animated circles */}
          <div className={cn(
            "absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl transition-all duration-700",
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )} />
          <div className={cn(
            "absolute -bottom-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl transition-all duration-1000 delay-200",
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )} />
        </div>

        {/* Menu Content */}
        <div className={cn(
          "relative h-full overflow-y-auto transition-all duration-500",
          isOpen ? "translate-y-0" : "-translate-y-8"
        )}>
          <div className="container mx-auto px-4 py-6 space-y-3">
            {/* Top Menu Items */}
            {mobileMenuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path, item.section)}
                className={cn(
                  "group flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl transition-all duration-300",
                  "transform",
                  isOpen ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0",
                  activeSection === item.section
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-secondary-foreground hover:bg-secondary-foreground/10"
                )}
                style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
              >
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                  activeSection === item.section 
                    ? "bg-primary-foreground/20" 
                    : "bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110"
                )}>
                  <item.icon className={cn(
                    "h-6 w-6 transition-all duration-300",
                    activeSection === item.section ? "" : "text-primary group-hover:rotate-12"
                  )} />
                </div>
                <span className="font-heading tracking-wide text-lg">{item.label}</span>
                {activeSection === item.section && (
                  <Sparkles className="h-4 w-4 ml-auto animate-pulse" />
                )}
              </button>
            ))}

            {/* SERVICIOS Accordion */}
            <div 
              className={cn(
                "space-y-2 transition-all duration-300",
                isOpen ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"
              )}
              style={{ transitionDelay: isOpen ? '100ms' : '0ms' }}
            >
              <button
                onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                className={cn(
                  "group flex items-center justify-between w-full text-left py-4 px-5 rounded-2xl transition-all duration-300",
                  isServiceActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-secondary-foreground hover:bg-secondary-foreground/10"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                    isServiceActive 
                      ? "bg-primary-foreground/20" 
                      : "bg-primary/10 group-hover:bg-primary/20"
                  )}>
                    <Wrench className={cn(
                      "h-6 w-6 transition-all duration-500",
                      isServiceActive ? "" : "text-primary",
                      isMobileServicesOpen ? "rotate-180" : "group-hover:rotate-45"
                    )} />
                  </div>
                  <span className="font-heading tracking-wide text-lg">SERVICIOS</span>
                </div>
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                  isServiceActive ? "bg-primary-foreground/20" : "bg-secondary-foreground/10"
                )}>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isMobileServicesOpen ? "rotate-180" : ""
                  )} />
                </div>
              </button>

              {/* Services Submenu */}
              <div className={cn(
                "overflow-hidden transition-all duration-500 ease-out",
                isMobileServicesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="pl-4 space-y-2 py-2">
                  {serviceItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.path, item.label)}
                      className={cn(
                        "group flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl transition-all duration-300",
                        "transform",
                        isMobileServicesOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
                        activeSection === item.label
                          ? "bg-primary/90 text-primary-foreground shadow-md"
                          : "text-secondary-foreground/80 hover:bg-secondary-foreground/10"
                      )}
                      style={{ transitionDelay: isMobileServicesOpen ? `${index * 75}ms` : '0ms' }}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300",
                        activeSection === item.label 
                          ? "bg-primary-foreground/20" 
                          : "bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110"
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5 transition-all duration-300",
                          activeSection === item.label ? "" : "text-primary group-hover:rotate-12"
                        )} />
                      </div>
                      <span className="font-heading tracking-wide">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Menu Items */}
            {bottomMenuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path, item.section)}
                className={cn(
                  "group flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl transition-all duration-300",
                  "transform",
                  isOpen ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0",
                  activeSection === item.section
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-secondary-foreground hover:bg-secondary-foreground/10"
                )}
                style={{ transitionDelay: isOpen ? `${(index + 3) * 50}ms` : '0ms' }}
              >
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                  activeSection === item.section 
                    ? "bg-primary-foreground/20" 
                    : "bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110"
                )}>
                  <item.icon className={cn(
                    "h-6 w-6 transition-all duration-300",
                    activeSection === item.section ? "" : "text-primary group-hover:rotate-12"
                  )} />
                </div>
                <span className="font-heading tracking-wide text-lg">{item.label}</span>
                {activeSection === item.section && (
                  <Sparkles className="h-4 w-4 ml-auto animate-pulse" />
                )}
              </button>
            ))}

            {/* Company info with animation */}
            <div 
              className={cn(
                "pt-8 mt-6 border-t border-secondary-foreground/10 transition-all duration-500",
                isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
              style={{ transitionDelay: isOpen ? '300ms' : '0ms' }}
            >
              <div className="flex items-center gap-3 px-5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-heading font-bold text-secondary-foreground">
                    {companyName}
                  </p>
                  <p className="text-xs text-secondary-foreground/60">
                    {siteSettings?.tagline || "Ingeniería y Construcción"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
