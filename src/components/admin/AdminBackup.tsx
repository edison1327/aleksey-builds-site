import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Database, Loader2, ShieldAlert } from "lucide-react";

// CMS content tables we back up. Sensitive auth/role/audit tables are intentionally excluded.
const TABLES = [
  "about_content",
  "blog_posts",
  "company_benefits",
  "contact_info",
  "hero_content",
  "job_positions",
  "machinery",
  "navigation_links",
  "projects",
  "response_templates",
  "services",
  "site_settings",
  "social_links",
  "team_stats",
  "testimonials",
  "vehicles",
] as const;

type TableName = (typeof TABLES)[number];

const AdminBackup = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const handleExport = async () => {
    setIsExporting(true);
    const payload: Record<string, unknown> = {
      __meta: {
        generated_at: new Date().toISOString(),
        version: 1,
        source: "cms-backup",
      },
    };

    try {
      for (const table of TABLES) {
        setProgress(`Exportando ${table}…`);
        const { data, error } = await supabase.from(table as TableName).select("*");
        if (error) throw new Error(`${table}: ${error.message}`);
        payload[table] = data || [];
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cms-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup generado",
        description: `Se exportaron ${TABLES.length} tablas correctamente.`,
      });
    } catch (e) {
      toast({
        title: "Error al generar backup",
        description: e instanceof Error ? e.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setProgress("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Backup del CMS
        </h2>
        <p className="text-muted-foreground">
          Exporta todo el contenido del CMS en un único archivo JSON.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exportación completa</CardTitle>
          <CardDescription>
            Genera un snapshot con el contenido público y editorial del sitio. Útil
            para auditoría, migración o respaldo offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TABLES.map((t) => (
              <Badge key={t} variant="secondary" className="font-mono text-xs">
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Por seguridad, las tablas <span className="font-mono">user_roles</span>,{" "}
              <span className="font-mono">audit_log</span>,{" "}
              <span className="font-mono">contact_messages</span>,{" "}
              <span className="font-mono">job_applications</span> y{" "}
              <span className="font-mono">equipment_bookings</span> no se incluyen en este backup.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              aria-label="Generar y descargar backup JSON del CMS"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? "Generando…" : "Descargar backup JSON"}
            </Button>
            {progress && <span className="text-sm text-muted-foreground">{progress}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBackup;
