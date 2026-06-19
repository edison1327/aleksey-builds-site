// Generates public/sitemap.xml at predev/prebuild.
// Includes static routes + published blog posts.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://aleksey.lovable.app";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://rqpcugvaikhqaeoacuhg.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcGN1Z3ZhaWtocWFlb2FjdWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjg1MTMsImV4cCI6MjA3NzYwNDUxM30.ht28ZvKSGX4X2Rt2g2eWrTMCGLAFmIvhSxlzp3xUM34";

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: Entry[] = [
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

async function fetchBlogEntries(): Promise<Entry[]> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, published_at, updated_at")
      .eq("published", true);
    if (error || !data) return [];
    return data.map((p: { slug: string; published_at: string | null; updated_at: string }) => ({
      path: `/blog/${p.slug}`,
      lastmod: (p.updated_at || p.published_at || "").slice(0, 10) || undefined,
      changefreq: "monthly" as const,
      priority: "0.6",
    }));
  } catch (e) {
    console.warn("sitemap: could not fetch blog posts —", e);
    return [];
  }
}

function buildSitemap(entries: Entry[]) {
  const urls = entries
    .map((e) =>
      [
        "  <url>",
        `    <loc>${BASE_URL}${e.path}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
  ].join("\n");
}

(async () => {
  const blog = await fetchBlogEntries();
  const entries = [...staticEntries, ...blog];
  writeFileSync(resolve("public/sitemap.xml"), buildSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();
