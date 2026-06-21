import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Activity, AlertTriangle, CheckCircle2, XCircle, RefreshCw, ImageIcon, FileText, Search, Mail, Link2 } from "lucide-react";

type Severity = "ok" | "warn" | "error";

interface HealthCheck {
  id: string;
  label: string;
  severity: Severity;
  description: string;
  count?: number;
  icon: typeof Activity;
  hint?: string;
}

const sevConfig: Record<Severity, { color: string; icon: typeof CheckCircle2; label: string }> = {
  ok: { color: "text-green-600 bg-green-100 dark:bg-green-900/30", icon: CheckCircle2, label: "OK" },
  warn: { color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30", icon: AlertTriangle, label: "Aviso" },
  error: { color: "text-red-600 bg-red-100 dark:bg-red-900/30", icon: XCircle, label: "Error" },
};

const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

const AdminSiteHealth = () => {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runChecks = async () => {
    setIsLoading(true);
    const results: HealthCheck[] = [];

    // Site settings
    const { data: site } = await supabase.from("site_settings").select("*").maybeSingle();
    if (!site) {
      results.push({ id: "site-missing", label: "Configuración del sitio", severity: "error", description: "No hay registro en site_settings.", icon: FileText });
    } else {
      const missing: string[] = [];
      if (isEmpty(site.company_name)) missing.push("nombre");
      if (isEmpty(site.logo_url)) missing.push("logo");
      if (isEmpty((site as Record<string, unknown>).favicon_url)) missing.push("favicon");
      results.push({
        id: "site",
        label: "Identidad del sitio",
        severity: missing.length ? "warn" : "ok",
        description: missing.length ? `Falta: ${missing.join(", ")}` : "Logo, nombre y favicon configurados.",
        icon: ImageIcon,
        hint: "Logo & Sitio",
      });
    }

    // Blog SEO
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("id, title, meta_title, meta_description, cover_image_url, is_published");
    if (posts) {
      const pub = posts.filter((p) => p.is_published);
      const missingMeta = pub.filter((p) => isEmpty(p.meta_title) || isEmpty(p.meta_description));
      const missingCover = pub.filter((p) => isEmpty(p.cover_image_url));
      results.push({
        id: "blog-seo",
        label: "SEO del blog",
        severity: missingMeta.length ? "warn" : "ok",
        description: missingMeta.length
          ? `${missingMeta.length} de ${pub.length} entradas publicadas sin meta title/description.`
          : `Las ${pub.length} entradas publicadas tienen SEO completo.`,
        count: missingMeta.length,
        icon: Search,
        hint: "Blog",
      });
      results.push({
        id: "blog-cover",
        label: "Portadas del blog",
        severity: missingCover.length ? "warn" : "ok",
        description: missingCover.length
          ? `${missingCover.length} entradas publicadas sin imagen de portada.`
          : "Todas las entradas publicadas tienen portada.",
        count: missingCover.length,
        icon: ImageIcon,
        hint: "Blog",
      });
    }

    // Services / Machinery / Vehicles / Projects images
    const tables = [
      { name: "services" as const, label: "Servicios", img: "image_url" },
      { name: "machinery" as const, label: "Maquinaria", img: "image_url" },
      { name: "vehicles" as const, label: "Vehículos", img: "image_url" },
      { name: "projects" as const, label: "Proyectos", img: "image_url" },
    ];
    for (const t of tables) {
      const { data } = await supabase.from(t.name).select(`id, ${t.img}, is_active`);
      if (!data) continue;
      const active = data.filter((r: Record<string, unknown>) => r.is_active !== false);
      const missing = active.filter((r: Record<string, unknown>) => isEmpty(r[t.img]));
      results.push({
        id: `${t.name}-img`,
        label: `${t.label} sin imagen`,
        severity: missing.length ? "warn" : "ok",
        description: missing.length
          ? `${missing.length} elementos activos sin imagen principal.`
          : `Todos los ${t.label.toLowerCase()} activos tienen imagen.`,
        count: missing.length,
        icon: ImageIcon,
        hint: t.label,
      });
    }

    // Unread messages older than 48h
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { count: staleMsg } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .lt("created_at", twoDaysAgo);
    results.push({
      id: "stale-messages",
      label: "Mensajes sin leer >48h",
      severity: (staleMsg ?? 0) > 0 ? "error" : "ok",
      description: (staleMsg ?? 0) > 0 ? `${staleMsg} mensajes pendientes hace más de 48h.` : "Bandeja al día.",
      count: staleMsg ?? 0,
      icon: Mail,
      hint: "Mensajes",
    });

    // Pending job applications
    const { count: pendingApp } = await supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    results.push({
      id: "pending-apps",
      label: "Postulaciones pendientes",
      severity: (pendingApp ?? 0) > 5 ? "warn" : "ok",
      description: `${pendingApp ?? 0} postulaciones en estado pendiente.`,
      count: pendingApp ?? 0,
      icon: FileText,
      hint: "Postulaciones",
    });

    // Navigation links
    const { data: navLinks } = await supabase.from("navigation_links").select("id, url, is_active");
    if (navLinks) {
      const broken = navLinks.filter((l) => l.is_active && (isEmpty(l.url) || l.url === "#"));
      results.push({
        id: "nav",
        label: "Enlaces de navegación",
        severity: broken.length ? "warn" : "ok",
        description: broken.length ? `${broken.length} enlaces activos sin URL válida.` : "Enlaces de navegación correctos.",
        count: broken.length,
        icon: Link2,
        hint: "Navegación",
      });
    }

    // Hero content
    const { data: hero } = await supabase.from("hero_content").select("*").maybeSingle();
    if (!hero) {
      results.push({ id: "hero", label: "Hero principal", severity: "error", description: "Sin contenido en hero_content.", icon: FileText });
    }

    setChecks(results);
    setLastRun(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const summary = useMemo(() => {
    const score = checks.length
      ? Math.round((checks.filter((c) => c.severity === "ok").length / checks.length) * 100)
      : 0;
    return {
      ok: checks.filter((c) => c.severity === "ok").length,
      warn: checks.filter((c) => c.severity === "warn").length,
      error: checks.filter((c) => c.severity === "error").length,
      score,
    };
  }, [checks]);

  if (isLoading && !checks.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Salud del Sitio
          </h2>
          <p className="text-muted-foreground">
            Diagnóstico automático del contenido y configuración
            {lastRun && <> · última revisión {lastRun.toLocaleTimeString()}</>}
          </p>
        </div>
        <Button variant="outline" onClick={runChecks} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Re-evaluar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Puntaje general</span>
            <span className="text-3xl font-bold">{summary.score}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={summary.score} className="h-3" />
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{summary.ok}</p>
              <p className="text-xs text-muted-foreground">OK</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{summary.warn}</p>
              <p className="text-xs text-muted-foreground">Avisos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{summary.error}</p>
              <p className="text-xs text-muted-foreground">Errores</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checks.map((c) => {
          const cfg = sevConfig[c.severity];
          const Icon = cfg.icon;
          return (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${cfg.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{c.label}</p>
                    <Badge variant="outline" className={cfg.color}>
                      {cfg.label}
                    </Badge>
                    {c.hint && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        · {c.hint}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                </div>
                <c.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSiteHealth;
