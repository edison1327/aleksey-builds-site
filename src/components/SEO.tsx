import { Helmet } from "react-helmet-async";

const SITE_URL = "https://aleksey.pe";
const DEFAULT_OG = `${SITE_URL}/og-image.jpg`;

interface SEOProps {
  title: string;
  description: string;
  path: string; // e.g. "/proyectos/mi-obra"
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Optional locale, e.g. "es" or "en". Defaults to the current <html lang>. */
  locale?: string;
}

/**
 * Per-route SEO + Open Graph + JSON-LD with hreflang alternates.
 * Keeps canonical and og:url self-referencing the current route.
 */
const SEO = ({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  jsonLd,
  locale,
}: SEOProps) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}${cleanPath}`;
  const ogImage = image || DEFAULT_OG;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const lang =
    locale ||
    (typeof document !== "undefined" ? document.documentElement.lang : "es") ||
    "es";
  const ogLocale = lang === "en" ? "en_US" : "es_ES";

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang alternates — same path is served in both languages via the in-app switcher */}
      <link rel="alternate" hrefLang="es" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={ogLocale} />
      <meta
        property="og:locale:alternate"
        content={ogLocale === "es_ES" ? "en_US" : "es_ES"}
      />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
