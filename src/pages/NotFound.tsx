import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, Phone, Briefcase, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const SUGGESTED_LINKS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/servicios", label: "Servicios", icon: Briefcase },
  { to: "/maquinaria", label: "Maquinaria", icon: Truck },
  { to: "/contacto", label: "Contacto", icon: Phone },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout showFooter={false} showScrollToTop={false}>
      <div className="flex min-h-[80vh] items-center justify-center bg-background pt-24 pb-12">
        <div className="text-center px-4 max-w-2xl">
          <div className="mb-6">
            <span className="text-8xl md:text-9xl font-heading font-bold text-primary">404</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
            Página no encontrada
          </h1>
          <p className="text-muted-foreground mb-2 max-w-md mx-auto">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          {location.pathname && (
            <p className="text-xs text-muted-foreground/70 mb-8 font-mono break-all">
              Ruta solicitada: {location.pathname}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver atrás
            </Button>
            <Button onClick={() => navigate("/")} className="gap-2">
              <Home className="h-4 w-4" />
              Ir al inicio
            </Button>
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Search className="h-4 w-4" />
              <span>Quizás te interese:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SUGGESTED_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
