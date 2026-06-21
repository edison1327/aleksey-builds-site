import { Facebook, Instagram, Linkedin, Twitter, Youtube, MessageCircle, MapPin, Phone, Mail, Clock, ShieldCheck, Award, HardHat, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { useContactInfo, useNavigationGroups, useSocialLinks, useHeroContent } from "@/hooks/useSiteData";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoAlekseyFallback from "@/assets/logo-aleksey.png";


const defaultContact = {
  address: "Av. Principal 123, Ciudad Capital",
  city: "Venezuela",
  phone: "+58 414 123 4567",
  email: "info@aleksey.com",
  business_hours: "Lun - Vie: 8:00 AM - 6:00 PM",
};

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  MessageCircle,
};

import { useTranslation } from "react-i18next";
import { useLocalizedField } from "@/lib/i18nField";

const Footer = () => {
  const { t } = useTranslation();
  const { data: contactInfo } = useContactInfo();
  const { data: siteSettings } = useSiteSettings();
  const { data: footerGroups } = useNavigationGroups("footer_");
  const { data: socialLinks } = useSocialLinks();
  const { data: hero } = useHeroContent();
  const tr = useLocalizedField();

  const logoUrl = siteSettings?.logo_url || logoAlekseyFallback;
  const companyName = siteSettings?.company_name || "ALEKSEY";
  const footerDescription = tr(siteSettings as any, "footer_description") || (siteSettings as any)?.footer_description || "Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada.";
  const footerCopyright = tr(siteSettings as any, "footer_copyright") || (siteSettings as any)?.footer_copyright || "Todos los derechos reservados.";

  const address = tr(contactInfo as any, "address") || contactInfo?.address || defaultContact.address;
  const city = contactInfo?.city || defaultContact.city;
  const country = contactInfo?.country || "";
  const phone = contactInfo?.phone || defaultContact.phone;
  const email = contactInfo?.email || defaultContact.email;
  const businessHours = tr(contactInfo as any, "business_hours") || contactInfo?.business_hours || defaultContact.business_hours;

  const fullAddress = country ? `${address}, ${city}, ${country}` : `${address}, ${city}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  const getSocialIcon = (iconName: string | null) => {
    if (!iconName) return Facebook;
    return socialIcons[iconName] || Facebook;
  };

  // Live metrics from hero_content (CMS-driven, with sane fallbacks)
  const metrics = [
    { label: "Proyectos entregados", value: hero?.projects_count ?? 120 },
    { label: "Años de experiencia", value: hero?.years_count ?? 15 },
    { label: "Profesionales en obra", value: hero?.employees_count ?? 80 },
    { label: "Proyectos activos", value: hero?.active_projects_count ?? 12 },
  ];

  const certifications = [
    { icon: ShieldCheck, label: "ISO 9001" },
    { icon: HardHat, label: "ISO 45001" },
    { icon: Leaf, label: "ISO 14001" },
    { icon: Award, label: "OHSAS 18001" },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Metrics band */}
      <div className="border-b border-secondary-foreground/10 bg-gradient-to-r from-secondary via-secondary to-primary/5">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {metrics.map((m) => (
              <div key={m.label} className="text-center md:text-left">
                <div className="text-3xl md:text-4xl font-heading font-bold text-primary leading-none mb-2">
                  +{m.value}
                </div>
                <div className="text-xs md:text-sm text-secondary-foreground/70 uppercase tracking-[0.12em]">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Logo y descripción */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <img src={logoUrl} alt={`${companyName} - Ingeniería y Construcción`} className="h-10 brightness-0 invert" />
            </div>
            <p className="text-secondary-foreground/80 leading-relaxed mb-6">
              {footerDescription}
            </p>
            {/* Redes sociales */}
            <div className="flex gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => {
                  const IconComponent = getSocialIcon(link.icon);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-secondary-foreground/10 p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                      aria-label={link.platform}
                    >
                      <IconComponent className="h-5 w-5" />
                    </a>
                  );
                })
              ) : (
                <>
                  <a
                    href="#"
                    className="bg-secondary-foreground/10 p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="bg-secondary-foreground/10 p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="bg-secondary-foreground/10 p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="bg-secondary-foreground/10 p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Grupos de enlaces dinámicos del footer */}
          {footerGroups.length > 0 ? (
            footerGroups.map((group) => (
              <div key={group.location}>
                <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">{tr(group as any, "title") || group.title}</h3>
                <ul className="space-y-2 text-secondary-foreground/80">
                  {group.links.map((link) => (
                    <li key={link.id}>
                      {link.path.startsWith("/#") ? (
                        <a href={link.path} className="hover:text-primary transition-colors">
                          {tr(link as any, "label") || link.label}
                        </a>
                      ) : (
                        <Link to={link.path} className="hover:text-primary transition-colors">
                          {tr(link as any, "label") || link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
              <div>
                <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">{t("footer.services")}</h3>
                <ul className="space-y-2 text-secondary-foreground/80">
                  <li><Link to="/construccion" className="hover:text-primary transition-colors">{t("nav.construction")}</Link></li>
                  <li><Link to="/ingenieria" className="hover:text-primary transition-colors">{t("nav.engineering")}</Link></li>
                  <li><Link to="/vehiculos" className="hover:text-primary transition-colors">{t("nav.vehicles")}</Link></li>
                  <li><Link to="/maquinaria" className="hover:text-primary transition-colors">{t("nav.machinery")}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">{t("footer.company")}</h3>
                <ul className="space-y-2 text-secondary-foreground/80">
                  <li><Link to="/nosotros" className="hover:text-primary transition-colors">{t("nav.about")}</Link></li>
                  <li><Link to="/proyectos" className="hover:text-primary transition-colors">{t("nav.projects")}</Link></li>
                  <li><a href="/#contact" className="hover:text-primary transition-colors">{t("nav.contact")}</a></li>
                  <li><Link to="/convocatoria" className="hover:text-primary transition-colors">{t("nav.careers")}</Link></li>
                </ul>
              </div>
            </>
          )}


          {/* Contacto */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">{t("footer.contact")}</h3>
            <ul className="space-y-3 text-secondary-foreground/80">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{fullAddress}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{businessHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 pt-8 text-center text-secondary-foreground/60">
          <p>
            © {new Date().getFullYear()} {companyName}. {footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;