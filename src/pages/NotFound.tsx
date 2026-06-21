import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, Compass, Mail, FolderKanban, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { GLOBAL_SEARCH_EVENT } from "@/components/GlobalSearch";

const SUGGESTED_LINKS = [
  { to: "/proyectos", label: "Proyectos", icon: FolderKanban, hint: "Lo que hemos construido" },
  { to: "/maquinaria", label: "Maquinaria", icon: Compass, hint: "Equipos en alquiler" },
  { to: "/blog", label: "Blog", icon: Newspaper, hint: "Notas de obra" },
  { to: "/#contact", label: "Contacto", icon: Mail, hint: "Hablemos" },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404:", location.pathname);
    document.title = "404 · Página no encontrada · ALEKSEY";
  }, [location.pathname]);

  const openSearch = () => window.dispatchEvent(new CustomEvent(GLOBAL_SEARCH_EVENT));

  return (
    <Layout showFooter={false} showScrollToTop={false}>
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-background pt-24 pb-16">
        {/* Decorative grid background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:48px_48px]"
        />
        {/* Ember glow */}
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          {/* Big number */}
          <div className="relative mb-8 select-none">
            <span
              aria-hidden="true"
              className="block font-heading font-black leading-none tracking-tighter text-[clamp(7rem,22vw,16rem)] text-foreground/[0.06]"
            >
              404
            </span>
            <span className="absolute inset-0 flex items-center justify-center font-heading font-black leading-none tracking-tighter text-[clamp(6rem,18vw,13rem)] bg-gradient-to-br from-primary via-primary to-primary/50 bg-clip-text text-transparent">
              404
            </span>
          </div>

          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Ruta sin obra asignada
          </p>

          <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4 leading-tight">
            Este terreno todavía no está nivelado.
          </h1>
          <p className="mx-auto max-w-xl text-base md:text-lg text-muted-foreground mb-2">
            La página que buscas no existe, fue movida o aún está en planos.
            Podemos llevarte de vuelta a terreno firme.
          </p>
          {location.pathname && (
            <p className="text-xs text-muted-foreground/70 mb-10 font-mono break-all">
              <span className="opacity-60">URL solicitada:</span> {location.pathname}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button onClick={() => navigate(-1)} variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver atrás
            </Button>
            <Button onClick={() => navigate("/")} size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Ir al inicio
            </Button>
            <Button onClick={openSearch} variant="ghost" size="lg" className="gap-2">
              <Search className="h-4 w-4" />
              Buscar en el sitio
              <kbd className="ml-1 hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
          </div>

          <div className="border-t border-border/60 pt-10">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-5">
              O explora estas secciones
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SUGGESTED_LINKS.map(({ to, label, icon: Icon, hint }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-card/60 backdrop-blur hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5 transition-all duration-200 text-left"
                >
                  <Icon className="h-5 w-5 text-primary transition-transform duration-200 group-hover:scale-110" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{hint}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
