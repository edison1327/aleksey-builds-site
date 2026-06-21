import { Helmet } from "react-helmet-async";

const SITE_URL = "https://aleksey.lovable.app";
const DEFAULT_OG = `${SITE_URL}/og-image.jpg`;

interface SEOProps {
  title: string;
  description: string;
  path: string; // e.g. "/proyectos/mi-obra"
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Per-route SEO + Open Graph + JSON-LD.
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
}: SEOProps) => {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImage = image || DEFAULT_OG;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />

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
