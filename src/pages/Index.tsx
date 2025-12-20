import { useState } from "react";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import ProjectsSection from "@/components/ProjectsSection";
import Vehicles from "@/components/Vehicles";
import Machinery from "@/components/Machinery";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SplashScreen from "@/components/SplashScreen";
import ScrollToTop from "@/components/ScrollToTop";
import SkipToContent from "@/components/SkipToContent";

const Index = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Solo mostrar splash si no se ha visto en esta sesión
    return !sessionStorage.getItem("splashShown");
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  return (
    <div className="min-h-screen">
      <SkipToContent />
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} duration={1500} />
      )}
      
      <main id="main-content">
        <Hero />
        <Services />
        <Vehicles />
        <Machinery />
        <ProjectsSection />
        <Testimonials />
        <CallToAction />
        <Contact />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
