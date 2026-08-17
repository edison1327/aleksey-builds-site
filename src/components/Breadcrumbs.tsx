import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  /** Base absolute URL for schema, e.g. https://aleksey.com.pe */
  baseUrl?: string;
  className?: string;
}

/**
 * Accessible breadcrumbs with BreadcrumbList JSON-LD for SEO.
 * The last item is rendered as the current page (no link, aria-current).
 */
const Breadcrumbs = ({ items, baseUrl = "https://aleksey.com.pe", className = "" }: BreadcrumbsProps) => {
  const full: Crumb[] = [{ label: "Inicio", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: full.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${baseUrl}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <nav
        aria-label="Ruta de navegación"
        className={`flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}
      >
        <ol className="flex items-center flex-wrap gap-1.5">
          {full.map((c, i) => {
            const isLast = i === full.length - 1;
            return (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />}
                {isLast || !c.href ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "text-foreground font-medium" : ""}
                  >
                    {i === 0 && <Home className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />}
                    {c.label}
                  </span>
                ) : (
                  <Link
                    to={c.href}
                    className="hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    {i === 0 && <Home className="w-3.5 h-3.5" aria-hidden="true" />}
                    {c.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;
