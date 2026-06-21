import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import PageTransition from "./PageTransition";
import Index from "@/pages/Index";
import { Loader2 } from "lucide-react";

// Lazy-loaded routes for better performance (code splitting)
const Construction = lazy(() => import("@/pages/Construction"));
const Engineering = lazy(() => import("@/pages/Engineering"));
const VehiclesPage = lazy(() => import("@/pages/VehiclesPage"));
const MachineryPage = lazy(() => import("@/pages/MachineryPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage"));
const CareersPage = lazy(() => import("@/pages/CareersPage"));
const QuotePage = lazy(() => import("@/pages/QuotePage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const PortalLogin = lazy(() => import("@/pages/PortalLogin"));
const MyQuotesPage = lazy(() => import("@/pages/MyQuotesPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));

const RouteFallback = () => (
  <div className="min-h-dvh flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <ScrollToTopOnNavigate />
      <PageTransition key={location.pathname}>
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/construccion" element={<Construction />} />
            <Route path="/ingenieria" element={<Engineering />} />
            <Route path="/vehiculos" element={<VehiclesPage />} />
            <Route path="/maquinaria" element={<MachineryPage />} />
            <Route path="/nosotros" element={<AboutPage />} />
            <Route path="/proyectos" element={<ProjectsPage />} />
            <Route path="/proyectos/:slug" element={<ProjectDetailPage />} />
            <Route path="/convocatoria" element={<CareersPage />} />
            <Route path="/cotizar" element={<QuotePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/mis-solicitudes" element={<MyQuotesPage />} />
            <Route path="/privacidad" element={<PrivacyPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </PageTransition>
    </>
  );
};

export default AnimatedRoutes;
