import { Card, CardContent } from "./ui/card";
import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";

const projects = [
  {
    title: "Residencial Vista del Mar",
    category: "Residencial",
    image: project1,
  },
  {
    title: "Centro Corporativo Plaza",
    category: "Comercial",
    image: project2,
  },
  {
    title: "Complejo Industrial Norte",
    category: "Industrial",
    image: project3,
  },
];

const Projects = () => {
  return (
    <section id="projects" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
            PROYECTOS DESTACADOS
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cada proyecto refleja nuestro compromiso con la excelencia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card
              key={index}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-card"
            >
              <div className="relative overflow-hidden h-64">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-sm font-heading font-semibold rounded-full mb-2 tracking-wide">
                    {project.category}
                  </span>
                  <h3 className="text-xl font-heading font-bold text-secondary-foreground tracking-wide">
                    {project.title}
                  </h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  Proyecto completado con éxito cumpliendo todos los estándares
                  de calidad y tiempos establecidos.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
