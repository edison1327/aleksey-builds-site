import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import logoAleksey from "@/assets/logo-aleksey.png";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <img src={logoAleksey} alt="ALEKSEY - Ingeniería y Construcción" className="h-10 brightness-0 invert" />
            </div>
            <p className="text-secondary-foreground/80 leading-relaxed">
              Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada.
            </p>
          </div>

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

          <div>
            <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">Síguenos</h3>
            <div className="flex gap-3">
              <a
                href="#"
                className="bg-secondary-foreground/10 p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-secondary-foreground/10 p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-secondary-foreground/10 p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-secondary-foreground/10 p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
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
