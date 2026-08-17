import { Helmet } from "react-helmet-async";
import { useContactInfo, useSocialLinks } from "@/hooks/useSiteData";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const SITE_URL = "https://aleksey.com.pe";

/**
 * Global JSON-LD schema (LocalBusiness) rendered on public pages.
 * Uses live contact + social data from the CMS.
 */
const StructuredData = () => {
  const { data: contact } = useContactInfo();
  const { data: socials } = useSocialLinks();
  const { data: settings } = useSiteSettings();

  const name = "Aleksey";
  const description =
    settings?.footer_description ||
    "Servicios de ingeniería, construcción, alquiler de maquinaria y vehículos industriales.";

  const sameAs = (socials ?? [])
    .map((s: any) => s.url)
    .filter(Boolean);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#organization`,
    name,
    url: SITE_URL,
    description,
    logo: `${SITE_URL}/favicon.png`,
    image: `${SITE_URL}/og-image.jpg`,
    ...(contact?.phone ? { telephone: contact.phone } : {}),
    ...(contact?.email ? { email: contact.email } : {}),
    ...(contact?.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: contact.address,
            ...(contact.city ? { addressLocality: contact.city } : {}),
            ...(contact.country ? { addressCountry: contact.country } : { addressCountry: "PE" }),
          },
        }
      : {}),
    ...(contact?.business_hours ? { openingHours: contact.business_hours } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name,
    inLanguage: ["es-PE", "en-US"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <script type="application/ld+json">{JSON.stringify(website)}</script>
    </Helmet>
  );
};

export default StructuredData;
