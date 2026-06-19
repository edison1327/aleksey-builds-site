-- Response templates
CREATE TABLE public.response_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.response_templates TO authenticated;
GRANT ALL ON public.response_templates TO service_role;

ALTER TABLE public.response_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage templates" ON public.response_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_response_templates_updated
  BEFORE UPDATE ON public.response_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image text,
  author text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT blog_posts_title_len CHECK (char_length(title) BETWEEN 3 AND 200)
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins manage all posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_blog_posts_updated
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_blog_posts_published ON public.blog_posts (published, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts (slug);