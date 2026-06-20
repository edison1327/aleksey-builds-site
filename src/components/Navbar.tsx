import { Building2, Home, Wrench, Truck, Settings, Phone, Users, FolderKanban, Sparkles, Calculator, Mail, MapPin, Award, Briefcase, UserCircle2, LogIn, LucideIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useNavigationLinks } from "@/hooks/useSiteData";
import { useAuth } from "@/hooks/useAuth";
import logoAlekseyFallback from "@/assets/logo-aleksey-light.png";
import logoMark from "@/assets/logo-mark.png";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { translateNavLabel } from "@/i18n/config";
import { useLocalizedField } from "@/lib/i18nField";
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
  const [scrollProgress, setScrollProgress] = useState(0);
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
  const tr = useLocalizedField();

  // Resuelve label en idioma activo: usa label_en de la DB si existe, si no cae al mapa estático.
  const labelOf = (item: any): string => {
    const dbLabel = tr(item, "label");
    return translateNavLabel(dbLabel || item.label);
  };

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

  // Track scroll: shadow state + progress bar (rAF throttled)
  useEffect(() => {
    let raf = 0;
    const handle = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScrolled(y > 10);
        setScrollProgress(max > 0 ? Math.min(100, (y / max) * 100) : 0);
        raf = 0;
      });
    };
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open + Esc to close
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Sync activeSection with current route + hash-section detection on home
  useEffect(() => {
    const match = items.find((i) => i.path === location.pathname);
    if (match) {
      setActiveSection(match.label);
      return;
    }
    if (location.pathname === "/") setActiveSection("INICIO");
  }, [location.pathname, items]);

  // IntersectionObserver for hash-anchored sections on home page
  useEffect(() => {
    if (location.pathname !== "/") return;
    const hashItems = items.filter((i) => i.path.startsWith("/#"));
    if (hashItems.length === 0) return;

    const targets: { el: Element; label: string }[] = [];
    hashItems.forEach((item) => {
      const id = item.path.slice(2);
      const el = document.getElementById(id);
      if (el) targets.push({ el, label: item.label });
    });
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const match = targets.find((t) => t.el === visible.target);
          if (match) setActiveSection(match.label);
        } else if (window.scrollY < 200) {
          setActiveSection("INICIO");
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    targets.forEach((t) => observer.observe(t.el));
    return () => observer.disconnect();
  }, [location.pathname, items]);

  // Swipe-up to close mobile menu
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.touches[0].clientY;
    if (delta > 60) {
      setIsOpen(false);
      touchStartY.current = null;
    }
  };

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
        {/* Scroll progress indicator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 shadow-[0_0_8px_hsl(var(--primary))] transition-[width] duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(scrollProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso de lectura de la página"
          />
        </div>
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
              className="flex items-center gap-2.5 cursor-pointer transition-opacity duration-200 hover:opacity-85 shrink-0 rounded-md lg:-ml-2 xl:-ml-4 animate-nav-fade-in"
              onClick={() => {
                navigate("/");
                setActiveSection("INICIO");
                setIsOpen(false);
              }}
              aria-label={`${companyName} — ir al inicio`}
            >
              {/* Compact mark — shown when scrolled or on small screens */}
              <img
                src={logoMark}
                alt=""
                aria-hidden="true"
                className={cn(
                  "transition-all duration-300 shrink-0",
                  scrolled ? "h-9 sm:hidden" : "hidden"
                )}
                width={40}
                height={40}
              />
              {/* Full wordmark — default state */}
              <img
                src={logoUrl}
                alt={`${companyName} - Ingeniería y Construcción`}
                className={cn(
                  "transition-all duration-300",
                  scrolled ? "hidden sm:block sm:h-9" : "h-9 sm:h-10 md:h-11"
                )}
                width={180}
                height={44}
              />
            </button>

            {/* Desktop Menu */}
            <div className="hidden xl:flex items-center flex-1 justify-end gap-0.5 xl:gap-1">
              <ul className="flex items-center gap-0 xl:gap-1" role="list">
                {navItems.map((item) => {
                  const isActive = activeSection === item.label;
                  return (
                    <li key={item.id} className="relative">
                      <button
                        onClick={() => handleNavClick(item.path, item.label)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center px-1.5 xl:px-4 h-10 text-[11px] xl:text-[13px] font-heading font-semibold tracking-[0.04em] xl:tracking-[0.08em] uppercase whitespace-nowrap rounded-md transition-colors duration-200",
                          isActive
                            ? "text-primary"
                            : "text-secondary-foreground/65 hover:text-secondary-foreground"
                        )}
                      >
                        <span className="relative z-10">{labelOf(item)}</span>
                        {/* Hover background */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute inset-x-1 inset-y-1.5 rounded-md bg-secondary-foreground/[0.06] opacity-0 transition-opacity duration-200",
                            !isActive && "group-hover:opacity-100"
                          )}
                        />
                        {/* Active bottom bar */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute left-1.5 right-1.5 xl:left-4 xl:right-4 -bottom-px h-[2px] rounded-full bg-primary origin-center transition-transform duration-300 ease-out",
                            isActive
                              ? "scale-x-100 shadow-[0_0_10px_hsl(var(--primary)/0.7)]"
                              : "scale-x-0 group-hover:scale-x-100 bg-primary/60"
                          )}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* CTA Cotizar */}
              {ctaItem && (
                <button
                  onClick={() => handleNavClick(ctaItem.path, ctaItem.label)}
                  className="ml-2 xl:ml-3 group relative inline-flex items-center gap-1.5 px-3 xl:px-5 h-10 rounded-md bg-primary text-primary-foreground text-[11.5px] xl:text-[13px] font-heading font-bold tracking-[0.06em] xl:tracking-[0.08em] uppercase shadow-[0_4px_14px_-2px_hsl(var(--primary)/0.5)] hover:shadow-[0_6px_20px_-2px_hsl(var(--primary)/0.65)] hover:-translate-y-px active:translate-y-0 transition-all duration-200 whitespace-nowrap ring-1 ring-inset ring-primary-foreground/15"
                >
                  <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                  {labelOf(ctaItem)}
                </button>
              )}

              {/* Divider + utilities */}
              <div className="ml-1 xl:ml-2 pl-1 xl:pl-2 flex items-center gap-0 xl:gap-1 border-l border-border/40">
                <button
                  onClick={() => navigate(user ? "/mis-solicitudes" : "/portal/login")}
                  aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
                  title={user ? "Mi cuenta" : "Iniciar sesión"}
                  className="hidden xl:flex items-center justify-center w-9 h-9 xl:w-10 xl:h-10 rounded-full text-secondary-foreground/75 hover:text-secondary-foreground hover:bg-secondary-foreground/10 transition-all duration-200"
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
            <div className="xl:hidden flex items-center gap-0.5">
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

      {/* Mobile Menu Overlay (click to close) */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar menú"
        className={cn(
          "xl:hidden fixed inset-0 z-[99] transition-all duration-500 cursor-default",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 backdrop-blur-sm" />
      </button>

      {/* Mobile Menu Panel */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className={cn(
          "xl:hidden fixed top-16 left-0 right-0 bottom-0 z-[101] transition-all duration-400 ease-out overflow-hidden",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        {/* Background */}
        <div
          className={cn(
            "absolute inset-0 bg-secondary transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isOpen ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        </div>

        <div
          className={cn(
            "relative h-full overflow-y-auto overscroll-contain transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="container mx-auto px-4 pt-3 pb-24 flex flex-col gap-4">
            {/* Swipe-up affordance */}
            <div className="flex justify-center mb-1" aria-hidden="true">
              <span className="w-10 h-1 rounded-full bg-secondary-foreground/20" />
            </div>
            {/* CTA Cotizar destacado */}
            {ctaItem && (
              <button
                onClick={() => handleNavClick(ctaItem.path, ctaItem.label)}
                className={cn(
                  "group relative overflow-hidden flex items-center justify-between w-full p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-300",
                  isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
                )}
                style={{ transitionDelay: isOpen ? "60ms" : "0ms" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-foreground/15">
                    <Calculator className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="text-left">
                    <p className="font-heading font-bold uppercase tracking-wide text-base leading-tight">
                      {labelOf(ctaItem)}
                    </p>
                    <p className="text-[11px] opacity-85">Recibe tu presupuesto rápido</p>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 opacity-75" aria-hidden="true" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
              </button>
            )}

            {/* Sección: Navegación */}
            <div>
              <p className="px-2 mb-2 text-[10px] font-heading uppercase tracking-[0.18em] text-secondary-foreground/40">
                Navegación
              </p>
              <ul role="list" className="space-y-1">
                {navItems.map((item, index) => {
                  const Icon = getIcon(item.icon);
                  const isActive = activeSection === item.label;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.path, item.label)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "relative group flex items-center gap-3 w-full text-left py-3 px-3 rounded-xl transition-all duration-300 transform tap-target",
                          isOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
                          isActive
                            ? "bg-secondary-foreground/[0.06] text-primary-foreground"
                            : "text-secondary-foreground/85 hover:bg-secondary-foreground/5 active:bg-secondary-foreground/10"
                        )}
                        style={{ transitionDelay: isOpen ? `${120 + index * 40}ms` : "0ms" }}
                      >
                        {/* Active rail */}
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
                          />
                        )}
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 shrink-0",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/40"
                              : "bg-secondary-foreground/[0.06] text-secondary-foreground/70 group-hover:bg-primary/15 group-hover:text-primary"
                          )}
                        >
                          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                        </div>
                        <span className={cn(
                          "font-heading tracking-wide text-[15px] flex-1",
                          isActive ? "font-semibold text-secondary-foreground" : "font-medium"
                        )}>
                          {labelOf(item)}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-heading uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/15">
                            Actual
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Cuenta */}
            <div
              className={cn(
                "transition-all duration-500",
                isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
              style={{ transitionDelay: isOpen ? "320ms" : "0ms" }}
            >
              <p className="px-2 mb-2 text-[10px] font-heading uppercase tracking-[0.18em] text-secondary-foreground/40">
                Cuenta
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(user ? "/mis-solicitudes" : "/portal/login");
                }}
                className="flex items-center gap-3 w-full text-left py-3 px-3 rounded-xl bg-secondary-foreground/[0.04] text-secondary-foreground hover:bg-secondary-foreground/10 transition-colors tap-target"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15 text-primary shrink-0">
                  {user ? <UserCircle2 className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                </div>
                <span className="font-heading font-medium text-[15px]">
                  {user ? t("nav.myAccount") : t("nav.signIn")}
                </span>
              </button>
            </div>

            {/* Company info footer */}
            <div
              className={cn(
                "mt-auto pt-6 border-t border-secondary-foreground/10 transition-all duration-500",
                isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
              style={{ transitionDelay: isOpen ? "400ms" : "0ms" }}
            >
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-heading font-bold text-secondary-foreground text-sm">{companyName}</p>
                  <p className="text-[11px] text-secondary-foreground/60">
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
