import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[18px] border-b-primary" />
              <span className="text-2xl font-heading font-bold tracking-wider">ALEKSEY</span>
            </div>
            <p className="text-secondary-foreground/80 leading-relaxed">
              Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada.
            </p>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">Servicios</h3>
            <ul className="space-y-2 text-secondary-foreground/80">
              <li className="hover:text-primary transition-colors cursor-pointer">Construcción</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Ingeniería</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Vehículos</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Maquinaria</li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4 tracking-wide">Empresa</h3>
            <ul className="space-y-2 text-secondary-foreground/80">
              <li className="hover:text-primary transition-colors cursor-pointer">Sobre Nosotros</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Proyectos</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Contacto</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Trabaja con Nosotros</li>
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
