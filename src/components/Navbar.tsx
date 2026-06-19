import { Building2, Home, Wrench, Truck, Settings, Phone, Users, FolderKanban, Sparkles, Calculator, Mail, MapPin, Award, Briefcase, UserCircle2, LogIn, LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useNavigationLinks } from "@/hooks/useSiteData";
import { useAuth } from "@/hooks/useAuth";
import logoAlekseyFallback from "@/assets/logo-aleksey.png";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { translateNavLabel } from "@/i18n/config";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

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
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  // re-render when language changes
  const lang = i18n.resolvedLanguage;

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

  // Separar CTA "COTIZAR" del resto para destacarla
  const ctaItem = items.find((i) => /cotiz/i.test(i.label) || i.path === "/cotizar");
  const navItems = items.filter((i) => i !== ctaItem);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav
        aria-label="Navegación principal"
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-300",
          scrolled
            ? "bg-secondary/85 backdrop-blur-xl shadow-lg shadow-black/10 border-b border-border/40"
            : "bg-secondary/70 backdrop-blur-md border-b border-transparent"
        )}
      >
        <div className="container mx-auto px-3 sm:px-4">
          <div
            className={cn(
              "flex items-center justify-between gap-3 transition-all duration-300",
              scrolled ? "h-14" : "h-16 sm:h-[68px]"
            )}
          >
            {/* Logo */}
            <button
              type="button"
              className="flex items-center cursor-pointer transition-opacity duration-200 hover:opacity-80 shrink-0 rounded-md"
              onClick={() => {
                navigate("/");
                setActiveSection("INICIO");
                setIsOpen(false);
              }}
              aria-label={`${companyName} — ir al inicio`}
            >
              <img
                src={logoUrl}
                alt={`${companyName} - Ingeniería y Construcción`}
                className={cn(
                  "transition-all duration-300",
                  scrolled ? "h-8 sm:h-9" : "h-9 sm:h-10 md:h-11"
                )}
                width={180}
                height={44}
              />
            </button>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center flex-1 justify-end gap-1">
              <ul className="flex items-center gap-0.5" role="list">
                {navItems.map((item) => {
                  const isActive = activeSection === item.label;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.path, item.label)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center px-3 xl:px-4 py-2 text-[13px] xl:text-sm font-heading font-medium tracking-wide whitespace-nowrap rounded-full transition-all duration-200",
                          isActive
                            ? "text-primary-foreground"
                            : "text-secondary-foreground/75 hover:text-secondary-foreground hover:bg-secondary-foreground/5"
                        )}
                      >
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 bg-primary rounded-full shadow-md shadow-primary/30"
                            style={{ zIndex: -1 }}
                          />
                        )}
                        <span className="relative z-10 uppercase">{translateNavLabel(item.label)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* CTA Cotizar */}
              {ctaItem && (
                <button
                  onClick={() => handleNavClick(ctaItem.path, ctaItem.label)}
                  className="ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-[13px] xl:text-sm font-heading font-semibold tracking-wide uppercase shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.03] active:scale-100 transition-all duration-200 whitespace-nowrap"
                >
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                  {translateNavLabel(ctaItem.label)}
                </button>
              )}

              {/* Divider + utilities */}
              <div className="ml-2 pl-2 flex items-center gap-1 border-l border-border/40">
                <button
                  onClick={() => navigate(user ? "/mis-solicitudes" : "/portal/login")}
                  aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
                  title={user ? "Mi cuenta" : "Iniciar sesión"}
                  className="flex items-center justify-center w-10 h-10 rounded-full text-secondary-foreground/75 hover:text-secondary-foreground hover:bg-secondary-foreground/10 transition-all duration-200"
                >
                  {user
                    ? <UserCircle2 className="h-[18px] w-[18px]" aria-hidden="true" />
                    : <LogIn className="h-[18px] w-[18px]" aria-hidden="true" />}
                </button>
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile: utilities + hamburger */}
            <div className="lg:hidden flex items-center gap-0.5">
              <ThemeToggle />
              <LanguageSwitcher />
              <button
                type="button"
                className="relative flex items-center justify-center w-11 h-11 text-secondary-foreground hover:bg-secondary-foreground/10 rounded-full transition-all duration-200"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                <div className="relative w-5 h-4 flex flex-col justify-between">
                  <span
                    className={cn(
                      "block h-0.5 w-5 bg-current rounded-full transition-all duration-300 origin-center",
                      isOpen ? "rotate-45 translate-y-[7px]" : ""
                    )}
                  />
                  <span
                    className={cn(
                      "block h-0.5 w-5 bg-current rounded-full transition-all duration-300",
                      isOpen ? "opacity-0 scale-0" : "opacity-100"
                    )}
                  />
                  <span
                    className={cn(
                      "block h-0.5 w-5 bg-current rounded-full transition-all duration-300 origin-center",
                      isOpen ? "-rotate-45 -translate-y-[7px]" : ""
                    )}
                  />
                </div>
              </button>
            </div>
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
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
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
                  <span className="font-heading tracking-wide text-lg">{translateNavLabel(item.label)}</span>
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
