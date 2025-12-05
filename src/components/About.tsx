import { Award, Users, Clock, CheckCircle } from "lucide-react";

const stats = [
  { icon: Award, value: "10+", label: "Años de Experiencia" },
  { icon: Users, value: "500+", label: "Proyectos Completados" },
  { icon: Clock, value: "100%", label: "Entregas a Tiempo" },
  { icon: CheckCircle, value: "98%", label: "Clientes Satisfechos" },
];

const About = () => {
  return (
    <section id="about" className="py-24 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 tracking-wide">
              SOBRE ALEKSEY
            </h2>
            <p className="text-lg mb-6 text-secondary-foreground/90 leading-relaxed">
              Somos una empresa constructora con más de una década de
              experiencia en el sector. Nos especializamos en proyectos
              residenciales, comerciales e industriales, siempre manteniendo
              nuestro compromiso con la calidad y la innovación.
            </p>
            <p className="text-lg mb-6 text-secondary-foreground/90 leading-relaxed">
              Nuestro equipo de profesionales altamente capacitados trabaja con
              las últimas tecnologías y mejores prácticas de la industria para
              garantizar resultados excepcionales en cada proyecto.
            </p>
            <p className="text-lg text-secondary-foreground/90 leading-relaxed">
              En ALEKSEY, no solo construimos edificios, construimos relaciones
              duraderas con nuestros clientes basadas en la confianza, la
              transparencia y la excelencia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-secondary-foreground/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-secondary-foreground/15 transition-colors"
              >
                <stat.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                <div className="text-4xl font-heading font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-secondary-foreground/80 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
