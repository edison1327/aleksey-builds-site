import { useRef, useEffect, useState } from "react";

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
}

const ParallaxImage = ({ src, alt, className = "", speed = 0.08 }: ParallaxImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Only apply parallax when element is in viewport
      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
        setOffset((scrollProgress - 0.5) * 100 * speed);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <img 
        src={src} 
        alt={alt}
        className="w-full h-[120%] object-cover transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${offset}px) scale(1.1)` }}
      />
    </div>
  );
};

export default ParallaxImage;
