import { Building2, Home, Wrench, Truck, Settings, Phone, Users, FolderKanban, Sparkles, Calculator, Mail, MapPin, Award, Briefcase, LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useNavigationLinks } from "@/hooks/useSiteData";
import logoAlekseyFallback from "@/assets/logo-aleksey.png";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Home,
  Users,
  Building2,
  Wrench,
  Truck,
  Settings,
  Phone,
  FolderKanban,
  Briefcase,
  Mail,
  MapPin,
  Award,
  Calculator,
};

const getIcon = (name: string | null | undefined): LucideIcon =>
  (name && iconMap[name]) || Home;

// Defaults if DB is empty
const FALLBACK_ITEMS = [
  { id: "fallback-1", label: "INICIO", path: "/", icon: "Home" },
  { id: "fallback-2", label: "SOBRE NOSOTROS", path: "/nosotros", icon: "Users" },
  { id: "fallback-3", label: "PROYECTOS", path: "/proyectos", icon: "FolderKanban" },
  { id: "fallback-4", label: "BLOG", path: "/blog", icon: "Award" },
  { id: "fallback-5", label: "COTIZAR", path: "/cotizar", icon: "Calculator" },
  { id: "fallback-6", label: "CONTACTO", path: "/#contact", icon: "Phone" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("INICIO");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: siteSettings } = useSiteSettings();
  const { data: navLinks } = useNavigationLinks("navbar");

  const logoUrl = siteSettings?.logo_url || logoAlekseyFallback;
  const companyName = siteSettings?.company_name || "ALEKSEY";

  const items = navLinks.length > 0 ? navLinks : FALLBACK_ITEMS;

  const handleNavClick = (path: string, label: string) => {
    setIsOpen(false);
    setActiveSection(label);

    if (path.startsWith("/#")) {
      const id = path.slice(2);
      if (location.pathname !== "/") {
        navigate(path);
        return;
      }
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (path === "/" && location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    navigate(path);
  };

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Sync activeSection with current route
  useEffect(() => {
    const match = items.find((i) => i.path === location.pathname);
    if (match) setActiveSection(match.label);
    else if (location.pathname === "/") setActiveSection("INICIO");
  }, [location.pathname, items]);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 bg-secondary z-[100] transition-all duration-300",
          scrolled
            ? "shadow-2xl shadow-black/20 backdrop-blur-md bg-secondary/95 border-b border-primary/20"
            : "backdrop-blur-sm"
        )}
      >
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
              {items.map((item) => {
                const Icon = getIcon(item.icon);
                const isActive = activeSection === item.label;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.path, item.label)}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 xl:px-4 py-2 text-sm xl:text-base font-heading tracking-wide transition-all duration-300",
                      isActive
                        ? "text-primary-foreground"
                        : "text-secondary-foreground/80 hover:text-primary-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-0 bg-primary rounded-full transition-all duration-400 ease-out",
                        isActive ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                      )}
                      style={{ zIndex: -1 }}
                    />
                    <Icon className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Animated Hamburger Button */}
            <button
              className="lg:hidden relative flex items-center justify-center w-12 h-12 text-secondary-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all duration-300"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <div className="relative w-6 h-5 flex flex-col justify-between">
                <span
                  className={cn(
                    "block h-0.5 w-6 bg-current rounded-full transition-all duration-300 origin-center",
                    isOpen ? "rotate-45 translate-y-2" : ""
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 w-6 bg-current rounded-full transition-all duration-300",
                    isOpen ? "opacity-0 scale-0" : "opacity-100"
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 w-6 bg-current rounded-full transition-all duration-300 origin-center",
                    isOpen ? "-rotate-45 -translate-y-2" : ""
                  )}
                />
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
      <div
        className={cn(
          "lg:hidden fixed top-14 sm:top-16 left-0 right-0 bottom-0 z-[101] transition-all duration-500 ease-out overflow-hidden",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-secondary transition-transform duration-500 ease-out",
            isOpen ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div
            className={cn(
              "absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl transition-all duration-700",
              isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          />
          <div
            className={cn(
              "absolute -bottom-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl transition-all duration-1000 delay-200",
              isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          />
        </div>

        <div
          className={cn(
            "relative h-full overflow-y-auto transition-all duration-500",
            isOpen ? "translate-y-0" : "-translate-y-8"
          )}
        >
          <div className="container mx-auto px-4 py-6 space-y-3">
            {items.map((item, index) => {
              const Icon = getIcon(item.icon);
              const isActive = activeSection === item.label;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path, item.label)}
                  className={cn(
                    "group flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl transition-all duration-300 transform",
                    isOpen ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-secondary-foreground hover:bg-secondary-foreground/10"
                  )}
                  style={{ transitionDelay: isOpen ? `${index * 50}ms` : "0ms" }}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                      isActive
                        ? "bg-primary-foreground/20"
                        : "bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 transition-all duration-300",
                        isActive ? "" : "text-primary group-hover:rotate-12"
                      )}
                    />
                  </div>
                  <span className="font-heading tracking-wide text-lg">{item.label}</span>
                  {isActive && <Sparkles className="h-4 w-4 ml-auto animate-pulse" />}
                </button>
              );
            })}

            {/* Company info */}
            <div
              className={cn(
                "pt-8 mt-6 border-t border-secondary-foreground/10 transition-all duration-500",
                isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
              style={{ transitionDelay: isOpen ? "300ms" : "0ms" }}
            >
              <div className="flex items-center gap-3 px-5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-heading font-bold text-secondary-foreground">{companyName}</p>
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
