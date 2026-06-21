import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Tag, ZoomIn } from "lucide-react";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import SEO from "@/components/SEO";
import Lightbox from "@/components/Lightbox";
import { useLightbox } from "@/hooks/useLightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects, Project } from "@/hooks/useSiteData";
import { useLocalizedField } from "@/lib/i18nField";

import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";

const defaultImages = [project1, project2, project3];

const getProjectImages = (project: Project, idx: number) => {
  const main = project.image_url || defaultImages[idx % defaultImages.length];
  const gallery = project.gallery_images || [];
  return [
    { src: main, alt: project.title, title: project.title },
    ...gallery.map((url, i) => ({
      src: url,
      alt: `${project.title} - Imagen ${i + 2}`,
      title: project.title,
    })),
  ];
};

const ProjectDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: projects, isLoading } = useProjects();
  const tr = useLocalizedField();

  const project = useMemo(
    () => projects.find((p) => p.slug === slug),
    [projects, slug]
  );
  const projectIndex = useMemo(
    () => (project ? projects.findIndex((p) => p.id === project.id) : 0),
    [projects, project]
  );

  const images = useMemo(
    () => (project ? getProjectImages(project, projectIndex) : []),
    [project, projectIndex]
  );
  const { isOpen, currentIndex, open, close, next, prev } = useLightbox(images);

  const related = useMemo(() => {
    if (!project) return [];
    return projects
      .filter((p) => p.id !== project.id && p.category === project.category)
      .slice(0, 3);
  }, [projects, project]);

  if (isLoading) {
    return (
      <div className="min-h-dvh pt-32 container mx-auto px-4">
        <Skeleton className="h-12 w-2/3 mb-6" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return <Navigate to="/proyectos" replace />;
  }

  const title = tr(project as any, "title") || project.title;
  const description =
    tr(project as any, "description") ||
    project.description ||
    `Proyecto ${title} realizado por ALEKSEY Construcción & Ingeniería.`;
  const location = tr(project as any, "location") || project.location;
  const category = tr(project as any, "category") || project.category;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: title,
      description,
      image: images.map((i) => i.src),
      dateCreated: project.year ? `${project.year}` : undefined,
      locationCreated: location ? { "@type": "Place", name: location } : undefined,
      creator: { "@type": "Organization", name: "ALEKSEY" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://aleksey.lovable.app/" },
        { "@type": "ListItem", position: 2, name: "Proyectos", item: "https://aleksey.lovable.app/proyectos" },
        { "@type": "ListItem", position: 3, name: title, item: `https://aleksey.lovable.app/proyectos/${project.slug}` },
      ],
    },
  ];

  const seoTitle = `${title} — Proyecto ALEKSEY`;
  const seoDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;

  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={`/proyectos/${project.slug}`}
        image={project.image_url || undefined}
        type="article"
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-secondary">
        <div className="container mx-auto px-4">
          <Link
            to="/proyectos"
            className="inline-flex items-center gap-2 text-secondary-foreground/80 hover:text-secondary-foreground mb-6 text-sm font-heading"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a proyectos
          </Link>
          <div className="max-w-4xl">
            {category && (
              <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-4">
                {category}
              </span>
            )}
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4 tracking-wide text-secondary-foreground">
              {title}
            </h1>
            <div className="flex flex-wrap gap-6 text-secondary-foreground/80">
              {location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {location}
                </span>
              )}
              {project.year && (
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {project.year}
                </span>
              )}
              {category && (
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4" /> {category}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main image + description */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={() => open(0)}
              className="group relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg block"
              aria-label="Ampliar imagen principal"
            >
              <img
                src={images[0]?.src}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity p-3 rounded-full bg-primary text-primary-foreground">
                  <ZoomIn className="w-6 h-6" />
                </span>
              </span>
            </button>
          </div>
          <aside className="space-y-4">
            <h2 className="text-2xl font-heading font-bold">Sobre el proyecto</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {description}
            </p>
            <Link
              to="/cotizar"
              className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-full font-heading text-sm hover:opacity-90 transition"
            >
              Solicitar un proyecto similar
            </Link>
          </aside>
        </div>
      </section>

      {/* Gallery */}
      {images.length > 1 && (
        <section className="pb-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-heading font-bold mb-6">Galería</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.slice(1).map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => open(i + 1)}
                  className="group relative aspect-square rounded-xl overflow-hidden"
                  aria-label={`Ver imagen ${i + 2}`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="py-16 bg-muted/40">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-heading font-bold mb-8">Proyectos relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p, i) => (
                <Link
                  key={p.id}
                  to={`/proyectos/${p.slug}`}
                  className="group bg-card rounded-2xl overflow-hidden shadow hover:shadow-xl transition-all"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={p.image_url || defaultImages[i % defaultImages.length]}
                      alt={tr(p as any, "title") || p.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors">
                      {tr(p as any, "title") || p.title}
                    </h3>
                    {p.location && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {tr(p as any, "location") || p.location}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
      <ScrollToTop />

      <Lightbox
        images={images}
        currentIndex={currentIndex}
        isOpen={isOpen}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </div>
  );
};

export default ProjectDetailPage;
