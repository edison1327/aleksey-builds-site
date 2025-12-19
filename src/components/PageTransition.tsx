import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Reset animation on route change
    setIsVisible(false);
    
    // Small delay for exit animation
    const exitTimer = setTimeout(() => {
      setDisplayChildren(children);
      // Start enter animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, 150);

    return () => clearTimeout(exitTimer);
  }, [location.pathname, children]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4"
      }`}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;
