import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Tag, ZoomIn, Building2, Clock, Target, Lightbulb, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import SEO from "@/components/SEO";
import Lightbox from "@/components/Lightbox";
import { useLightbox } from "@/hooks/useLightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects, Project } from "@/hooks/useSiteData";
import { useLocalizedField, pickLocalized } from "@/lib/i18nField";
import { useTranslation } from "react-i18next";

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
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || "es").slice(0, 2);

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
  const challenge = pickLocalized(project as any, "challenge", lang);
  const solution = pickLocalized(project as any, "solution", lang);
  const outcome = pickLocalized(project as any, "outcome", lang);
  const duration = pickLocalized(project as any, "duration", lang);

  const isCaseStudy = project.is_case_study && (challenge || solution || outcome);
  const metrics = project.metrics || [];
  const services = project.services_used || [];

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
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://aleksey.pe/" },
        { "@type": "ListItem", position: 2, name: "Proyectos", item: "https://aleksey.pe/proyectos" },
        { "@type": "ListItem", position: 3, name: title, item: `https://aleksey.pe/proyectos/${project.slug}` },
      ],
    },
  ];

  const seoTitle = `${title} — ${isCaseStudy ? "Caso de estudio" : "Proyecto"} ALEKSEY`;
  const seoDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;

  // ====== CASE STUDY LAYOUT ======
  if (isCaseStudy) {
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

        {/* Immersive hero */}
        <section className="relative min-h-[78vh] flex items-end overflow-hidden">
          <img
            src={images[0]?.src}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/20" />
          <div aria-hidden="true" className="absolute inset-0 [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:64px_64px] opacity-[0.04]" />

          <div className="relative z-10 container mx-auto px-4 pb-16 pt-32 max-w-5xl">
            <Link
              to="/proyectos"
              className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary mb-8 text-sm font-heading"
            >
              <ArrowLeft className="w-4 h-4" /> {lang === "en" ? "All projects" : "Volver a proyectos"}
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.12em]">
                {lang === "en" ? "Case study" : "Caso de estudio"}
              </span>
              {category && (
                <span className="inline-block px-3 py-1 rounded-full bg-card/80 backdrop-blur border border-border text-xs font-semibold">
                  {category}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 tracking-tight leading-[1.05] max-w-4xl">
              {title}
            </h1>

            {description && (
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8">
                {description}
              </p>
            )}

            {/* Meta strip */}
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 pt-6 border-t border-border/60 max-w-3xl">
              {project.client && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> {lang === "en" ? "Client" : "Cliente"}
                  </dt>
                  <dd className="text-sm font-semibold text-foreground">{project.client}</dd>
                </div>
              )}
              {location && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {lang === "en" ? "Location" : "Ubicación"}
                  </dt>
                  <dd className="text-sm font-semibold text-foreground">{location}</dd>
                </div>
              )}
              {project.year && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> {lang === "en" ? "Year" : "Año"}
                  </dt>
                  <dd className="text-sm font-semibold text-foreground">{project.year}</dd>
                </div>
              )}
              {duration && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {lang === "en" ? "Duration" : "Duración"}
                  </dt>
                  <dd className="text-sm font-semibold text-foreground">{duration}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {/* Metrics band */}
        {metrics.length > 0 && (
          <section className="border-y border-border bg-card/40">
            <div className="container mx-auto px-4 py-10">
              <div className={`grid gap-6 ${metrics.length === 2 ? "grid-cols-2" : metrics.length === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
                {metrics.map((m, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-5xl font-heading font-bold text-primary leading-none mb-2">
                      {m.value}
                      {m.unit && <span className="text-lg md:text-2xl text-primary/70 ml-1">{m.unit}</span>}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-[0.12em]">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Storytelling: Challenge → Solution → Outcome */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-4xl space-y-20">
            {challenge && (
              <article className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10">
                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary shrink-0">
                    <Target className="w-7 h-7" />
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">01 · {lang === "en" ? "Challenge" : "El reto"}</div>
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 leading-tight">
                    {lang === "en" ? "The challenge" : "El reto"}
                  </h2>
                  <p className="text-base md:text-lg leading-[1.8] text-foreground/85 whitespace-pre-line">
                    {challenge}
                  </p>
                </div>
              </article>
            )}

            {solution && (
              <article className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10">
                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary shrink-0">
                    <Lightbulb className="w-7 h-7" />
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">02 · {lang === "en" ? "Solution" : "La solución"}</div>
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 leading-tight">
                    {lang === "en" ? "Our approach" : "Nuestra solución"}
                  </h2>
                  <p className="text-base md:text-lg leading-[1.8] text-foreground/85 whitespace-pre-line">
                    {solution}
                  </p>
                  {services.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border/60">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-3 font-semibold">
                        {lang === "en" ? "Services applied" : "Servicios aplicados"}
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-2">
                        {services.map((s) => (
                          <li key={s} className="flex items-center gap-2 text-sm text-foreground/85">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            )}

            {outcome && (
              <article className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10">
                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary shrink-0">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">03 · {lang === "en" ? "Outcome" : "El resultado"}</div>
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 leading-tight">
                    {lang === "en" ? "Results delivered" : "Resultado entregado"}
                  </h2>
                  <p className="text-base md:text-lg leading-[1.8] text-foreground/85 whitespace-pre-line">
                    {outcome}
                  </p>
                </div>
              </article>
            )}
          </div>
        </section>

        {/* Expanded gallery */}
        {images.length > 1 && (
          <section className="pb-20 bg-muted/30">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="flex items-end justify-between mb-8 pt-16">
                <h2 className="text-2xl md:text-3xl font-heading font-bold">
                  {lang === "en" ? "From the field" : "Desde la obra"}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {images.length - 1} {lang === "en" ? "photos" : "fotos"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {images.slice(1).map((img, i) => {
                  // Vary aspect for editorial feel
                  const tall = i % 5 === 0;
                  const wide = i % 5 === 2;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => open(i + 1)}
                      className={`group relative overflow-hidden rounded-xl ${
                        tall ? "row-span-2 aspect-[3/4]" : wide ? "col-span-2 aspect-[16/9]" : "aspect-square"
                      }`}
                      aria-label={`Ver imagen ${i + 2}`}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-20 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4 font-semibold">
              {lang === "en" ? "Have a similar project?" : "¿Tienes un proyecto similar?"}
            </p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">
              {lang === "en" ? "Let's build it together." : "Construyámoslo juntos."}
            </h2>
            <p className="text-secondary-foreground/75 text-lg mb-10 max-w-xl mx-auto">
              {lang === "en"
                ? "Tell us about your project — we'll respond with a detailed proposal within 48 hours."
                : "Cuéntanos sobre tu proyecto — te respondemos con una propuesta detallada en menos de 48 horas."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/cotizar"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-full font-heading font-bold text-sm hover:opacity-90 transition shadow-lg shadow-primary/30"
              >
                {lang === "en" ? "Request a quote" : "Solicitar cotización"} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/#contact"
                className="inline-flex items-center justify-center px-7 py-3.5 border border-secondary-foreground/30 rounded-full font-heading font-bold text-sm hover:bg-secondary-foreground/10 transition"
              >
                {lang === "en" ? "Talk to us" : "Conversemos"}
              </Link>
            </div>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8">
                {lang === "en" ? "More projects" : "Más proyectos"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/proyectos/${p.slug}`}
                    className="group bg-card rounded-2xl overflow-hidden shadow hover:shadow-xl hover:-translate-y-1 transition-all"
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
  }

  // ====== STANDARD LAYOUT (unchanged) ======
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
