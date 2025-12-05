import { useState, useEffect } from "react";
import logoAleksey from "@/assets/logo-aleksey.png";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen = ({ onComplete, duration = 2500 }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-secondary transition-all duration-500 ${
        isExiting ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--secondary-foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--secondary-foreground)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Decorative circles */}
      <div className="absolute w-[500px] h-[500px] border border-primary/10 rounded-full animate-[spin_20s_linear_infinite]" />
      <div className="absolute w-[350px] h-[350px] border border-primary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      <div className="absolute w-[200px] h-[200px] border border-primary/30 rounded-full animate-[spin_10s_linear_infinite]" />

      {/* Main Content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="animate-fade-in flex flex-col items-center gap-3">
          <img 
            src={logoAleksey} 
            alt="ALEKSEY - Ingeniería y Construcción" 
            className="h-16 md:h-20 lg:h-24 drop-shadow-lg"
          />
          <span 
            className="text-secondary-foreground font-semibold tracking-[0.3em] text-xs md:text-sm opacity-0 animate-fade-in"
            style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
          >
            INGENIERÍA Y CONSTRUCCIÓN
          </span>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-secondary-foreground/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full animate-loading-bar"
            style={{
              animation: `loading-bar ${duration - 500}ms ease-out forwards`,
            }}
          />
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-primary/50 to-transparent" />
      </div>
      <div className="absolute bottom-8 right-8 w-16 h-16">
        <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-primary/50 to-transparent" />
        <div className="absolute bottom-0 right-0 h-full w-px bg-gradient-to-t from-primary/50 to-transparent" />
      </div>
    </div>
  );
};

export default SplashScreen;
