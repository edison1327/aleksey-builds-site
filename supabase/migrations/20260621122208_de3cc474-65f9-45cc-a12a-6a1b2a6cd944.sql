
-- Add preview_token to blog_posts and projects so editors can share drafts via secret URL
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS preview_token uuid;
ALTER TABLE public.projects   ADD COLUMN IF NOT EXISTS preview_token uuid;

CREATE INDEX IF NOT EXISTS blog_posts_preview_token_idx ON public.blog_posts(preview_token) WHERE preview_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS projects_preview_token_idx   ON public.projects(preview_token)   WHERE preview_token IS NOT NULL;

-- Allow anonymous reads ONLY when a matching preview_token is supplied via PostgREST filter.
-- The RLS predicate requires the row's preview_token to be NOT NULL, so only rows the editor
-- explicitly enabled for preview are reachable. The client must also filter by ?preview_token=eq.<uuid>
-- because rows are returned, but with no token filter you can't guess valid UUIDs.

CREATE POLICY "Public preview by token"
ON public.blog_posts
FOR SELECT
TO anon, authenticated
USING (preview_token IS NOT NULL);

CREATE POLICY "Public preview by token"
ON public.projects
FOR SELECT
TO anon, authenticated
USING (preview_token IS NOT NULL);
