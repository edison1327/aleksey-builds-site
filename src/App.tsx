import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Construction from "./pages/Construction";
import Engineering from "./pages/Engineering";
import VehiclesPage from "./pages/VehiclesPage";
import MachineryPage from "./pages/MachineryPage";
import AboutPage from "./pages/AboutPage";
import ProjectsPage from "./pages/ProjectsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/construccion" element={<Construction />} />
          <Route path="/ingenieria" element={<Engineering />} />
          <Route path="/vehiculos" element={<VehiclesPage />} />
          <Route path="/maquinaria" element={<MachineryPage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/proyectos" element={<ProjectsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
