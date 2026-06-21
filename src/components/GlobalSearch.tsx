import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderKanban,
  Newspaper,
  Cog,
  Truck,
  Briefcase,
  ArrowRight,
  Search,
} from "lucide-react";

export const GLOBAL_SEARCH_EVENT = "open-global-search";

type Source = "project" | "blog" | "machinery" | "vehicle" | "service";

interface Hit {
  id: string;
  label: string;
  sub?: string;
  source: Source;
  to: string;
}

const META: Record<Source, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  project: { label: "Proyectos", icon: FolderKanban },
  blog: { label: "Blog", icon: Newspaper },
  machinery: { label: "Maquinaria", icon: Cog },
  vehicle: { label: "Vehículos", icon: Truck },
  service: { label: "Servicios", icon: Briefcase },
};

const QUICK_LINKS: { label: string; to: string }[] = [
  { label: "Inicio", to: "/" },
  { label: "Sobre nosotros", to: "/nosotros" },
  { label: "Proyectos", to: "/proyectos" },
  { label: "Maquinaria", to: "/maquinaria" },
  { label: "Vehículos", to: "/vehiculos" },
  { label: "Blog", to: "/blog" },
  { label: "Cotizar", to: "/cotizar" },
  { label: "Convocatoria", to: "/convocatoria" },
  { label: "Contacto", to: "/#contact" },
];

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Open via keyboard (⌘/Ctrl+K) or custom event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(GLOBAL_SEARCH_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(GLOBAL_SEARCH_EVENT, onOpen);
    };
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch("");
      setHits([]);
    }
  }, [open]);

  // Live search across public content
  useEffect(() => {
    const term = search.trim();
    if (!open || term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      try {
        const [prj, blg, mch, veh, svc] = await Promise.all([
          supabase
            .from("projects")
            .select("id,title,slug,location,category")
            .eq("is_active", true)
            .or(`title.ilike.${like},description.ilike.${like},location.ilike.${like}`)
            .limit(6),
          supabase
            .from("blog_posts")
            .select("id,title,slug,excerpt")
            .eq("published", true)
            .or(`title.ilike.${like},excerpt.ilike.${like}`)
            .limit(6),
          supabase
            .from("machinery")
            .select("id,name,category,brand")
            .eq("is_active", true)
            .or(`name.ilike.${like},brand.ilike.${like},description.ilike.${like}`)
            .limit(6),
          supabase
            .from("vehicles")
            .select("id,name,brand,vehicle_type")
            .eq("is_active", true)
            .or(`name.ilike.${like},brand.ilike.${like},description.ilike.${like}`)
            .limit(6),
          supabase
            .from("services")
            .select("id,title,description")
            .eq("is_active", true)
            .or(`title.ilike.${like},description.ilike.${like}`)
            .limit(6),
        ]);
        if (ctrl.signal.aborted) return;
        const out: Hit[] = [];
        prj.data?.forEach((r: any) =>
          out.push({
            id: r.id,
            label: r.title,
            sub: [r.category, r.location].filter(Boolean).join(" · "),
            source: "project",
            to: r.slug ? `/proyectos/${r.slug}` : "/proyectos",
          })
        );
        blg.data?.forEach((r: any) =>
          out.push({
            id: r.id,
            label: r.title,
            sub: r.excerpt ?? undefined,
            source: "blog",
            to: `/blog/${r.slug}`,
          })
        );
        mch.data?.forEach((r: any) =>
          out.push({
            id: r.id,
            label: r.name,
            sub: [r.brand, r.category].filter(Boolean).join(" · "),
            source: "machinery",
            to: `/maquinaria#card-${r.id}`,
          })
        );
        veh.data?.forEach((r: any) =>
          out.push({
            id: r.id,
            label: r.name,
            sub: [r.brand, r.vehicle_type].filter(Boolean).join(" · "),
            source: "vehicle",
            to: `/vehiculos#card-${r.id}`,
          })
        );
        svc.data?.forEach((r: any) =>
          out.push({
            id: r.id,
            label: r.title,
            sub: r.description?.slice(0, 80),
            source: "service",
            to: "/#services",
          })
        );
        setHits(out);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [search, open]);

  const grouped = useMemo(() => {
    return hits.reduce<Record<Source, Hit[]>>((acc, h) => {
      (acc[h.source] ||= []).push(h);
      return acc;
    }, {} as Record<Source, Hit[]>);
  }, [hits]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar proyectos, blog, maquinaria, vehículos, servicios…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Buscando…" : search.trim().length < 2 ? "Escribe al menos 2 caracteres." : "Sin resultados."}
        </CommandEmpty>

        {(Object.keys(grouped) as Source[]).map((src, idx) => {
          const list = grouped[src];
          if (!list?.length) return null;
          const { label, icon: Icon } = META[src];
          return (
            <div key={src}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={label}>
                {list.map((h) => (
                  <CommandItem
                    key={`${src}-${h.id}`}
                    value={`${label} ${h.label} ${h.sub ?? ""}`}
                    onSelect={() => go(h.to)}
                    className="gap-3"
                  >
                    <Icon className="h-4 w-4 opacity-70 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{h.label}</div>
                      {h.sub && (
                        <div className="text-xs text-muted-foreground truncate">{h.sub}</div>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 opacity-40 shrink-0" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}

        {search.trim().length < 2 && (
          <>
            <CommandGroup heading="Ir a">
              {QUICK_LINKS.map((q) => (
                <CommandItem key={q.to} value={`Ir a ${q.label}`} onSelect={() => go(q.to)}>
                  <Search className="h-4 w-4 opacity-60 mr-2" />
                  {q.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
