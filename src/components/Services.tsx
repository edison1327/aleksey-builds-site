import { Building, HardHat, HomeIcon, Wrench, Truck, Settings } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const services = [
  {
    icon: Building,
    title: "Construcción Residencial",
    description: "Diseño y edificación de viviendas unifamiliares y multifamiliares de alta calidad.",
  },
  {
    icon: HardHat,
    title: "Infraestructura Vial",
    description: "Construcción y mantenimiento de carreteras, puentes y vías de acceso.",
  },
  {
    icon: HomeIcon,
    title: "Edificaciones Comerciales",
    description: "Construcción de naves industriales, oficinas y locales comerciales.",
  },
  {
    icon: Wrench,
    title: "Ingeniería Civil",
    description: "Diseño estructural, estudios de suelo y supervisión de obras.",
  },
  {
    icon: Truck,
    title: "Vehículos Comerciales",
    description: "Alquiler de camiones, volquetes y vehículos de transporte pesado.",
  },
  {
    icon: Settings,
    title: "Maquinaria Pesada",
    description: "Excavadoras, retroexcavadoras, grúas y equipos especializados.",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
            NUESTROS SERVICIOS
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ofrecemos una gama completa de servicios para satisfacer todas sus necesidades de construcción e ingeniería
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card"
            >
              <CardContent className="p-8">
                <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <service.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-3 tracking-wide">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
