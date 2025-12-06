import { Facebook, Instagram, Linkedin, Twitter, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useContactInfo } from "@/hooks/useSiteData";
import logoAleksey from "@/assets/logo-aleksey.png";

// Default contact info
const defaultContact = {
  address: "Av. Principal 123, Ciudad Capital",
  city: "Venezuela",
  phone: "+58 414 123 4567",
  email: "info@aleksey.com",
  business_hours: "Lun - Vie: 8:00 AM - 6:00 PM",
};

const Footer = () => {
  const { data: contactInfo } = useContactInfo();
  
  // Use database contact info or defaults
  const address = contactInfo?.address || defaultContact.address;
  const city = contactInfo?.city || defaultContact.city;
  const country = contactInfo?.country || "";
  const phone = contactInfo?.phone || defaultContact.phone;
  const email = contactInfo?.email || defaultContact.email;
  const businessHours = contactInfo?.business_hours || defaultContact.business_hours;
  
  const fullAddress = country ? `${address}, ${city}, ${country}` : `${address}, ${city}`;

  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Logo y descripción */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <img src={logoAleksey} alt="ALEKSEY - Ingeniería y Construcción" className="h-10 brightness-0 invert" />
            </div>
            <p className="text-secondary-foreground/80 leading-relaxed mb-6">
              Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada.
            </p>
            {/* Redes sociales */}
            <div className="flex gap-3">
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
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">Servicios</h3>
            <ul className="space-y-2 text-secondary-foreground/80">
              <li><Link to="/construccion" className="hover:text-primary transition-colors">Construcción</Link></li>
              <li><Link to="/ingenieria" className="hover:text-primary transition-colors">Ingeniería</Link></li>
              <li><Link to="/vehiculos" className="hover:text-primary transition-colors">Vehículos</Link></li>
              <li><Link to="/maquinaria" className="hover:text-primary transition-colors">Maquinaria</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">Empresa</h3>
            <ul className="space-y-2 text-secondary-foreground/80">
              <li><Link to="/nosotros" className="hover:text-primary transition-colors">Sobre Nosotros</Link></li>
              <li><Link to="/proyectos" className="hover:text-primary transition-colors">Proyectos</Link></li>
              <li><a href="/#contact" className="hover:text-primary transition-colors">Contacto</a></li>
              <li><Link to="/convocatoria" className="hover:text-primary transition-colors">Trabaja con Nosotros</Link></li>
            </ul>
          </div>

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
            © {new Date().getFullYear()} ALEKSEY. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
