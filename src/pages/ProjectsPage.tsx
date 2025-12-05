import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";
import construccionResidencial from "@/assets/construccion-residencial.jpg";
import edificacionesComerciales from "@/assets/edificaciones-comerciales.jpg";
import infraestructuraVial from "@/assets/infraestructura-vial.jpg";

const projects = [
  {
    id: 1,
    title: "Torre Residencial Mirador",
    category: "Construcción Residencial",
    description: "Complejo habitacional de 15 pisos con 120 departamentos de lujo, áreas verdes y amenidades de primer nivel.",
    image: project1,
    year: "2023",
    location: "Ciudad Capital",
  },
  {
    id: 2,
    title: "Centro Comercial Plaza Norte",
    category: "Edificación Comercial",
    description: "Centro comercial de 25,000 m² con diseño arquitectónico moderno, 150 locales comerciales y estacionamiento para 500 vehículos.",
    image: project2,
    year: "2023",
    location: "Zona Norte",
  },
  {
    id: 3,
    title: "Autopista Regional Sur",
    category: "Infraestructura Vial",
    description: "Construcción de 45 km de autopista con 3 intercambios viales, puentes y señalización completa.",
    image: project3,
    year: "2022",
    location: "Región Sur",
  },
  {
    id: 4,
    title: "Residencial Los Pinos",
    category: "Construcción Residencial",
    description: "Desarrollo de 80 casas unifamiliares con áreas comunes, parques y seguridad 24/7.",
    image: construccionResidencial,
    year: "2022",
    location: "Zona Este",
  },
  {
    id: 5,
    title: "Edificio Corporativo Alfa",
    category: "Edificación Comercial",
    description: "Torre de oficinas de 20 pisos con certificación LEED, sistemas inteligentes y diseño sustentable.",
    image: edificacionesComerciales,
    year: "2021",
    location: "Centro Financiero",
  },
  {
    id: 6,
    title: "Puente Río Grande",
    category: "Infraestructura Vial",
    description: "Puente vehicular de 300 metros de longitud con capacidad para tráfico pesado y peatonal.",
    image: infraestructuraVial,
    year: "2021",
    location: "Valle Central",
  },
];

const categories = ["Todos", "Construcción Residencial", "Edificación Comercial", "Infraestructura Vial"];

const ProjectsPage = () => {
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
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                className="px-6 py-2 rounded-full font-heading text-sm transition-all duration-300 bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
              >
                {category}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                      {project.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{project.year}</span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {project.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
