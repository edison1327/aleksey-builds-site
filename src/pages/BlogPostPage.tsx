import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, ArrowLeft, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/i18nField";

interface Post {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  content: string;
  content_en: string | null;
  cover_image: string | null;
  author: string | null;
  published_at: string | null;
  tags: string[];
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || "es").slice(0, 2);
  const title = post ? pickLocalized(post as any, "title", lang) : "";
  const excerpt = post ? pickLocalized(post as any, "excerpt", lang) : "";
  const content = post ? pickLocalized(post as any, "content", lang) : "";

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        setPost(data as Post | null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-dvh pt-32 container mx-auto px-4 max-w-3xl">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-dvh pt-32 pb-20 container mx-auto px-4 text-center">
        <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-heading font-bold mb-2">Artículo no encontrado</h1>
        <p className="text-muted-foreground mb-6">El artículo que buscas no existe o fue retirado.</p>
        <Button onClick={() => navigate("/blog")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Ver todos los artículos
        </Button>
      </div>
    );
  }

  const canonical = `https://aleksey.lovable.app/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt || undefined,
    image: post.cover_image || undefined,
    author: { "@type": "Person", name: post.author || "ALEKSEY" },
    publisher: {
      "@type": "Organization",
      name: "ALEKSEY",
      logo: { "@type": "ImageObject", url: "https://aleksey.lovable.app/logo.png" },
    },
    datePublished: post.published_at,
    dateModified: post.published_at,
    mainEntityOfPage: canonical,
  };

  return (
    <div className="min-h-dvh">
      <Helmet>
        <title>{title} | Blog ALEKSEY</title>
        {excerpt && <meta name="description" content={excerpt} />}
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        {excerpt && <meta property="og:description" content={excerpt} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <article className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> {lang === "en" ? "Back to blog" : "Volver al blog"}
          </Link>

          {post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {post.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4 leading-tight">
            {title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            {post.author && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" /> {post.author}
              </span>
            )}
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.published_at), "dd 'de' MMMM, yyyy", { locale: es })}
              </span>
            )}
          </div>

          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={title}
              className="w-full rounded-2xl mb-8 object-cover max-h-[480px]"
            />
          )}

          {excerpt && (
            <p className="text-lg text-muted-foreground italic mb-6 border-l-4 border-primary pl-4">
              {excerpt}
            </p>
          )}

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {(content || "").split(/\n{2,}/).map((para, i) => (
              <p key={i} className="mb-4 whitespace-pre-wrap leading-relaxed text-foreground/90">
                {para}
              </p>
            ))}
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
