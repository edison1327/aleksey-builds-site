import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useSiteData";
import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";

// Default projects for when database is empty
const defaultProjects = [
  {
    id: "1",
    title: "Torre Residencial Mirador",
    category: "Construcción Residencial",
    description: "Complejo habitacional de 15 pisos con 120 departamentos de lujo.",
    image_url: project1,
  },
  {
    id: "2",
    title: "Centro Comercial Plaza Norte",
    category: "Edificación Comercial",
    description: "Centro comercial de 25,000 m² con diseño arquitectónico moderno.",
    image_url: project2,
  },
  {
    id: "3",
    title: "Autopista Regional Sur",
    category: "Infraestructura Vial",
    description: "Construcción de 45 km de autopista con 3 intercambios viales.",
    image_url: project3,
  },
];

const ProjectsSection = () => {
  const navigate = useNavigate();
  const { data: dbProjects, isLoading } = useProjects(3);
  
  // Use database projects if available, otherwise use defaults
  const projects = dbProjects.length > 0 ? dbProjects : defaultProjects;

  return (
    <section id="projects" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-wide text-foreground">
            NUESTROS PROYECTOS
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre algunos de nuestros proyectos más destacados que demuestran nuestra capacidad y experiencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative overflow-hidden rounded-2xl bg-card shadow-lg hover:shadow-xl transition-all duration-500"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={project.image_url || project1}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/95 via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {project.category || "Proyecto"}
                </span>
                <h3 className="text-xl font-heading font-bold text-secondary-foreground mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                  {project.title}
                </h3>
                <p className="text-secondary-foreground/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                  {project.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => navigate("/proyectos")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-heading font-semibold rounded-full hover:bg-primary/90 transition-all duration-300 hover:gap-4"
          >
            Ver Todos los Proyectos
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
