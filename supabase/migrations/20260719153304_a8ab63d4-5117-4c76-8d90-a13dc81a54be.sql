
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_contact_messages_deleted_at ON public.contact_messages (deleted_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_deleted_at ON public.blog_posts (deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects (deleted_at);
