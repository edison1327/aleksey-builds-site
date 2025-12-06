import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useProjects } from "@/hooks/useSiteData";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

// Default images as fallback
import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";

const defaultImages = [project1, project2, project3];

const ProjectsPage = () => {
  const { data: projects, isLoading } = useProjects();
  const [activeCategory, setActiveCategory] = useState("Todos");

  // Get unique categories from projects
  const categories = ["Todos", ...new Set(projects.map(p => p.category).filter(Boolean))];

  // Filter projects by category
  const filteredProjects = activeCategory === "Todos" 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 tracking-wide text-secondary-foreground">
              NUESTROS PROYECTOS
            </h1>
            <p className="text-xl text-secondary-foreground/80 leading-relaxed">
              Conoce los proyectos que nos han convertido en líderes del sector de la construcción e ingeniería.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Category Filter */}
          {!isLoading && categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category as string)}
                  className={`px-6 py-2 rounded-full font-heading text-sm transition-all duration-300 ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-96 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No hay proyectos disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={project.image_url || defaultImages[index % defaultImages.length]}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {project.category && (
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                          {project.category}
                        </span>
                      )}
                      {project.year && (
                        <span className="text-xs text-muted-foreground">{project.year}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    {project.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        {project.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6 text-primary-foreground">
            ¿Tienes un proyecto en mente?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Contáctanos y hagamos realidad tu próximo proyecto de construcción o ingeniería.
          </p>
          <a
            href="/#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground font-heading font-semibold rounded-full hover:bg-secondary/90 transition-all duration-300"
          >
            Contáctanos
          </a>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default ProjectsPage;
