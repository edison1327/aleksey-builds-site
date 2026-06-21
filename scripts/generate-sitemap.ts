// Runs before `vite dev` and `vite build` (predev/prebuild). Writes public/sitemap.xml.
// Fetches active projects and published blog posts from Supabase via the anon key.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://aleksey.pe";
const SUPABASE_URL = "https://rqpcugvaikhqaeoacuhg.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcGN1Z3ZhaWtocWFlb2FjdWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjg1MTMsImV4cCI6MjA3NzYwNDUxM30.ht28ZvKSGX4X2Rt2g2eWrTMCGLAFmIvhSxlzp3xUM34";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/nosotros", changefreq: "monthly", priority: "0.8" },
  { path: "/proyectos", changefreq: "weekly", priority: "0.8" },
  { path: "/construccion", changefreq: "monthly", priority: "0.7" },
  { path: "/ingenieria", changefreq: "monthly", priority: "0.7" },
  { path: "/maquinaria", changefreq: "weekly", priority: "0.8" },
  { path: "/vehiculos", changefreq: "weekly", priority: "0.8" },
  { path: "/cotizar", changefreq: "monthly", priority: "0.9" },
  { path: "/convocatoria", changefreq: "weekly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
];

async function fetchJson<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
  });
  if (!res.ok) {
    console.warn(`[sitemap] ${path} -> ${res.status} ${res.statusText}`);
    return [];
  }
  return (await res.json()) as T[];
}

async function buildEntries(): Promise<SitemapEntry[]> {
  const [projects, posts] = await Promise.all([
    fetchJson<{ slug: string | null; updated_at: string }>(
      "projects?select=slug,updated_at&is_active=eq.true"
    ),
    fetchJson<{ slug: string; published_at: string | null; updated_at: string }>(
      "blog_posts?select=slug,published_at,updated_at&published=eq.true"
    ),
  ]);

  const projectEntries: SitemapEntry[] = projects
    .filter((p) => !!p.slug)
    .map((p) => ({
      path: `/proyectos/${p.slug}`,
      lastmod: p.updated_at?.slice(0, 10),
      changefreq: "monthly",
      priority: "0.7",
    }));

  const postEntries: SitemapEntry[] = posts.map((p) => ({
    path: `/blog/${p.slug}`,
    lastmod: (p.published_at ?? p.updated_at)?.slice(0, 10),
    changefreq: "monthly",
    priority: "0.6",
  }));

  return [...staticEntries, ...projectEntries, ...postEntries];
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  try {
    const entries = await buildEntries();
    writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
    console.log(`sitemap.xml written (${entries.length} entries)`);
  } catch (err) {
    console.warn("[sitemap] generation failed, keeping previous file:", err);
  }
})();
