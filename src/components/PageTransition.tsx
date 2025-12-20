import { useEffect, useState, Suspense } from "react";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Start loading state and hide content
    setIsLoading(true);
    setIsVisible(false);
    
    // Small delay for exit animation
    const exitTimer = setTimeout(() => {
      setDisplayChildren(children);
      
      // End loading and start enter animation
      const loadTimer = setTimeout(() => {
        setIsLoading(false);
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }, 300);

      return () => clearTimeout(loadTimer);
    }, 150);

    return () => clearTimeout(exitTimer);
  }, [location.pathname, children]);

  return (
    <>
      {/* Loading Spinner Overlay */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300 ${
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>

      {/* Page Content */}
      <div
        className={`transition-opacity duration-300 ease-out ${
          isVisible 
            ? "opacity-100" 
            : "opacity-0 pointer-events-none"
        }`}
      >
        <Suspense fallback={<LoadingSpinner size="lg" text="Cargando..." fullScreen />}>
          {displayChildren}
        </Suspense>
      </div>
    </>
  );
};

export default PageTransition;
