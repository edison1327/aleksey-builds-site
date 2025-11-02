import { Building, HardHat, HomeIcon, Wrench } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const services = [
  {
    icon: Building,
    title: "Construcción Residencial",
    description:
      "Casas unifamiliares, edificios de departamentos y desarrollos habitacionales con los más altos estándares de calidad.",
  },
  {
    icon: HardHat,
    title: "Obras Comerciales",
    description:
      "Oficinas, locales comerciales y centros empresariales diseñados para potenciar tu negocio.",
  },
  {
    icon: Wrench,
    title: "Remodelaciones",
    description:
      "Renovación y modernización de espacios existentes adaptados a tus nuevas necesidades.",
  },
  {
    icon: HomeIcon,
    title: "Proyectos Industriales",
    description:
      "Naves industriales, almacenes y plantas de producción con infraestructura especializada.",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Soluciones integrales en construcción adaptadas a cada necesidad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border bg-card"
            >
              <CardContent className="p-6">
                <div className="bg-accent/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <service.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
