import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Vehicles from "@/components/Vehicles";
import Machinery from "@/components/Machinery";
import CallToAction from "@/components/CallToAction";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SplashScreen from "@/components/SplashScreen";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="min-h-screen">
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} duration={2500} />
      )}
      <Navbar />
      <Hero />
      <Services />
      <Vehicles />
      <Machinery />
      <CallToAction />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
