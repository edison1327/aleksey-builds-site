import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import ChatWidget from "@/components/ChatWidget";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

const AppShell = () => {
  const { pathname } = useLocation();
  const hideNavbar = pathname.startsWith("/admin");
  const hideChatWidget = pathname.startsWith("/admin");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <ErrorBoundary>
        <AnimatedRoutes />
      </ErrorBoundary>
      {!hideChatWidget && (
        <ErrorBoundary fallback={<></>}>
          <ChatWidget />
        </ErrorBoundary>
      )}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
