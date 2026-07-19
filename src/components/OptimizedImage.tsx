import { useState, useRef, useEffect, useMemo } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Requested display width in px for srcset generation (defaults to 1200). */
  sizes?: string;
}

/**
 * Rewrites a Supabase Storage public URL to use Image Transformations
 * (webp/avif, width, quality). Non-Supabase URLs pass through unchanged.
 */
const buildTransform = (src: string, opts: { width?: number; format?: "webp" | "avif" | "origin"; quality?: number }) => {
  if (!src) return src;
  if (!src.includes("/storage/v1/object/public/")) return src;
  const rendered = src.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.quality) params.set("quality", String(opts.quality));
  if (opts.format && opts.format !== "origin") params.set("format", opts.format);
  const qs = params.toString();
  return qs ? `${rendered}?${qs}` : rendered;
};

const isSupabaseImage = (src: string) => src?.includes("/storage/v1/object/public/");

const WIDTHS = [480, 768, 1200, 1600];

const OptimizedImage = ({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px",
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const transforms = useMemo(() => {
    if (!isSupabaseImage(src)) return null;
    return {
      avifSrcset: WIDTHS.map((w) => `${buildTransform(src, { width: w, format: "avif", quality: 75 })} ${w}w`).join(", "),
      webpSrcset: WIDTHS.map((w) => `${buildTransform(src, { width: w, format: "webp", quality: 80 })} ${w}w`).join(", "),
      fallback: buildTransform(src, { width: 1200, quality: 82 }),
    };
  }, [src]);

  useEffect(() => {
    if (priority) { setIsInView(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsInView(true); observer.disconnect(); } },
      { rootMargin: "200px", threshold: 0.01 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => { setHasError(true); setIsLoaded(true); };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-r from-muted via-muted/80 to-muted animate-pulse transition-opacity duration-500 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      />

      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-muted-foreground text-sm text-center p-4">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Imagen no disponible
          </div>
        </div>
      )}

      {isInView && !hasError && (
        <picture>
          {transforms && <source type="image/avif" srcSet={transforms.avifSrcset} sizes={sizes} />}
          {transforms && <source type="image/webp" srcSet={transforms.webpSrcset} sizes={sizes} />}
          <img
            ref={imgRef}
            src={transforms?.fallback ?? src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            // @ts-expect-error - fetchpriority is valid HTML but not yet in React types everywhere
            fetchpriority={priority ? "high" : "auto"}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </picture>
      )}
    </div>
  );
};

export default OptimizedImage;
