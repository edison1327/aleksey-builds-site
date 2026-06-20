import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rule {
  label: string;
  value: number;
  min: number;
  max: number;
  hint?: string;
}

interface SEOIndicatorProps {
  title: string;
  description: string;
  className?: string;
  /** Optional extras: slug, cover image presence, etc. */
  hasCover?: boolean;
  hasSlug?: boolean;
}

/**
 * Compact traffic-light SEO checker for content forms.
 * Green = within range, Amber = close, Red = out of range.
 */
const SEOIndicator = ({ title, description, className, hasCover, hasSlug }: SEOIndicatorProps) => {
  const rules: Rule[] = [
    { label: "Título", value: title.trim().length, min: 30, max: 60, hint: "30–60 caracteres ideal para Google" },
    { label: "Descripción", value: description.trim().length, min: 70, max: 160, hint: "70–160 caracteres ideal para meta description" },
  ];

  const statusOf = (r: Rule): "good" | "warn" | "bad" => {
    if (r.value === 0) return "bad";
    if (r.value >= r.min && r.value <= r.max) return "good";
    const margin = r.max * 0.2;
    if (r.value >= r.min - margin && r.value <= r.max + margin) return "warn";
    return "bad";
  };

  const Icon = ({ s }: { s: "good" | "warn" | "bad" }) =>
    s === "good" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
    s === "warn" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
    <XCircle className="h-4 w-4 text-destructive" />;

  const allGood = rules.every((r) => statusOf(r) === "good") && (hasCover ?? true) && (hasSlug ?? true);

  return (
    <div className={cn("rounded-md border bg-muted/30 p-3 space-y-2", className)}>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="uppercase tracking-wider text-muted-foreground">SEO</span>
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px]",
          allGood ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        )}>
          {allGood ? "Optimizado" : "Revisar"}
        </span>
      </div>
      <ul className="space-y-1.5 text-xs">
        {rules.map((r) => {
          const s = statusOf(r);
          return (
            <li key={r.label} className="flex items-center gap-2">
              <Icon s={s} />
              <span className="flex-1">
                <span className="font-medium">{r.label}:</span>{" "}
                <span className="text-muted-foreground">{r.value} / {r.min}–{r.max}</span>
              </span>
            </li>
          );
        })}
        {hasCover !== undefined && (
          <li className="flex items-center gap-2">
            <Icon s={hasCover ? "good" : "warn"} />
            <span className="flex-1"><span className="font-medium">Imagen de portada:</span>{" "}
              <span className="text-muted-foreground">{hasCover ? "ok" : "recomendada"}</span>
            </span>
          </li>
        )}
        {hasSlug !== undefined && (
          <li className="flex items-center gap-2">
            <Icon s={hasSlug ? "good" : "bad"} />
            <span className="flex-1"><span className="font-medium">Slug:</span>{" "}
              <span className="text-muted-foreground">{hasSlug ? "definido" : "requerido"}</span>
            </span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default SEOIndicator;
