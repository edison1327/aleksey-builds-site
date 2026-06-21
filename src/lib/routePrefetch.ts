// Maps route paths to their dynamic import factories.
// Hovering/focusing a link triggers a prefetch so the chunk is ready when clicked.
const routeImporters: Record<string, () => Promise<unknown>> = {
  "/construccion": () => import("@/pages/Construction"),
  "/ingenieria": () => import("@/pages/Engineering"),
  "/vehiculos": () => import("@/pages/VehiclesPage"),
  "/maquinaria": () => import("@/pages/MachineryPage"),
  "/nosotros": () => import("@/pages/AboutPage"),
  "/proyectos": () => import("@/pages/ProjectsPage"),
  "/convocatoria": () => import("@/pages/CareersPage"),
  "/cotizar": () => import("@/pages/QuotePage"),
  "/blog": () => import("@/pages/BlogPage"),
  "/privacidad": () => import("@/pages/PrivacyPage"),
  "/mis-solicitudes": () => import("@/pages/MyQuotesPage"),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (!path) return;
  // Normalize: strip hash/search and trailing slash
  const clean = path.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
  if (prefetched.has(clean)) return;
  const importer = routeImporters[clean];
  if (!importer) return;
  prefetched.add(clean);
  // Fire-and-forget. Network errors are silent — user click will retry.
  importer().catch(() => prefetched.delete(clean));
}

export function getPrefetchHandlers(path: string) {
  const handler = () => prefetchRoute(path);
  return { onMouseEnter: handler, onFocus: handler, onTouchStart: handler };
}
