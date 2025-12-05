import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Vehicles from "@/components/Vehicles";
import Machinery from "@/components/Machinery";
import CallToAction from "@/components/CallToAction";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SplashScreen from "@/components/SplashScreen";
import ScrollToTop from "@/components/ScrollToTop";

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
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} duration={1500} />
      )}
      <Navbar />
      <Hero />
      <Services />
      <Vehicles />
      <Machinery />
      <CallToAction />
      <Contact />
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
