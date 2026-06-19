import { Facebook, Instagram, Linkedin, Twitter, Youtube, MessageCircle, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useContactInfo, useNavigationGroups, useSocialLinks } from "@/hooks/useSiteData";
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

const Footer = () => {
  const { data: contactInfo } = useContactInfo();
  const { data: siteSettings } = useSiteSettings();
  const { data: footerGroups } = useNavigationGroups("footer_");
  const { data: socialLinks } = useSocialLinks();

  const logoUrl = siteSettings?.logo_url || logoAlekseyFallback;
  const companyName = siteSettings?.company_name || "ALEKSEY";
  const footerDescription = siteSettings?.footer_description || "Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada.";
  const footerCopyright = siteSettings?.footer_copyright || "Todos los derechos reservados.";

  const address = contactInfo?.address || defaultContact.address;
  const city = contactInfo?.city || defaultContact.city;
  const country = contactInfo?.country || "";
  const phone = contactInfo?.phone || defaultContact.phone;
  const email = contactInfo?.email || defaultContact.email;
  const businessHours = contactInfo?.business_hours || defaultContact.business_hours;

  const fullAddress = country ? `${address}, ${city}, ${country}` : `${address}, ${city}`;

  const getSocialIcon = (iconName: string | null) => {
    if (!iconName) return Facebook;
    return socialIcons[iconName] || Facebook;
  };


  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
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
                <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">{group.title}</h3>
                <ul className="space-y-2 text-secondary-foreground/80">
                  {group.links.map((link) => (
                    <li key={link.id}>
                      {link.path.startsWith("/#") ? (
                        <a href={link.path} className="hover:text-primary transition-colors">
                          {link.label}
                        </a>
                      ) : (
                        <Link to={link.path} className="hover:text-primary transition-colors">
                          {link.label}
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
                <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">Servicios</h3>
                <ul className="space-y-2 text-secondary-foreground/80">
                  <li><Link to="/construccion" className="hover:text-primary transition-colors">Construcción</Link></li>
                  <li><Link to="/ingenieria" className="hover:text-primary transition-colors">Ingeniería</Link></li>
                  <li><Link to="/vehiculos" className="hover:text-primary transition-colors">Vehículos</Link></li>
                  <li><Link to="/maquinaria" className="hover:text-primary transition-colors">Maquinaria</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">Empresa</h3>
                <ul className="space-y-2 text-secondary-foreground/80">
                  <li><Link to="/nosotros" className="hover:text-primary transition-colors">Sobre Nosotros</Link></li>
                  <li><Link to="/proyectos" className="hover:text-primary transition-colors">Proyectos</Link></li>
                  <li><a href="/#contact" className="hover:text-primary transition-colors">Contacto</a></li>
                  <li><Link to="/convocatoria" className="hover:text-primary transition-colors">Trabaja con Nosotros</Link></li>
                </ul>
              </div>
            </>
          )}


          {/* Contacto */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">Contacto</h3>
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