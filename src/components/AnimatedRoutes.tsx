import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import PageTransition from "./PageTransition";
import Index from "@/pages/Index";
import Construction from "@/pages/Construction";
import Engineering from "@/pages/Engineering";
import VehiclesPage from "@/pages/VehiclesPage";
import MachineryPage from "@/pages/MachineryPage";
import AboutPage from "@/pages/AboutPage";
import ProjectsPage from "@/pages/ProjectsPage";
import CareersPage from "@/pages/CareersPage";
import QuotePage from "@/pages/QuotePage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import PortalLogin from "@/pages/PortalLogin";
import MyQuotesPage from "@/pages/MyQuotesPage";
import NotFound from "@/pages/NotFound";

// Component that scrolls to top on route change
const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top immediately when route changes
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <ScrollToTopOnNavigate />
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/construccion" element={<Construction />} />
          <Route path="/ingenieria" element={<Engineering />} />
          <Route path="/vehiculos" element={<VehiclesPage />} />
          <Route path="/maquinaria" element={<MachineryPage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/proyectos" element={<ProjectsPage />} />
          <Route path="/convocatoria" element={<CareersPage />} />
          <Route path="/cotizar" element={<QuotePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </>
  );
};

export default AnimatedRoutes;
