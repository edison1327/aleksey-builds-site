import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout showFooter={false} showScrollToTop={false}>
      <div className="flex min-h-[80vh] items-center justify-center bg-background pt-16">
        <div className="text-center px-4">
          <div className="mb-8">
            <span className="text-8xl md:text-9xl font-heading font-bold text-primary">404</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
            Página no encontrada
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver atrás
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Ir al inicio
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
