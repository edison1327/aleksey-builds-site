import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, User, ArrowRight } from "lucide-react";
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
  cover_image: string | null;
  author: string | null;
  published_at: string | null;
  tags: string[];
}

const BlogPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || "es").slice(0, 2);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, slug, title, title_en, excerpt, excerpt_en, cover_image, author, published_at, tags")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setPosts((data as Post[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Blog | ALEKSEY — Noticias y artículos del sector construcción</title>
        <meta
          name="description"
          content="Artículos, casos de éxito y novedades sobre construcción, ingeniería y maquinaria pesada en Perú."
        />
        <link rel="canonical" href="https://aleksey.lovable.app/blog" />
        <meta property="og:title" content="Blog ALEKSEY" />
        <meta property="og:url" content="https://aleksey.lovable.app/blog" />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="pt-32 pb-12 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Newspaper className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-secondary-foreground mb-3">
            BLOG Y NOTICIAS
          </h1>
          <p className="text-secondary-foreground/80 max-w-2xl mx-auto">
            Casos de éxito, consejos técnicos y novedades del sector construcción.
          </p>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aún no hay artículos publicados. Vuelve pronto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                  <Card className="overflow-hidden border-0 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full">
                    {p.cover_image ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Newspaper className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      {p.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-2">
                          {p.tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <h2 className="text-lg font-heading font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {pickLocalized(p as any, "title", lang)}
                      </h2>
                      {(pickLocalized(p as any, "excerpt", lang)) && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{pickLocalized(p as any, "excerpt", lang)}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                        <div className="flex items-center gap-3">
                          {p.author && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {p.author}
                            </span>
                          )}
                          {p.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(p.published_at), "dd MMM yyyy", { locale: es })}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;
