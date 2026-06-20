import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Cog, Truck, Briefcase, Newspaper, MessageSquare } from "lucide-react";

export interface PaletteItem {
  id: string;
  label: string;
  category: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ContentHit {
  id: string;
  label: string;
  source: "service" | "machinery" | "vehicle" | "project" | "blog" | "message";
  tabId: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PaletteItem[];
  onSelect: (id: string) => void;
}

const SOURCE_META: Record<ContentHit["source"], { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  service: { label: "Servicios", icon: Briefcase },
  machinery: { label: "Maquinaria", icon: Cog },
  vehicle: { label: "Vehículos", icon: Truck },
  project: { label: "Proyectos", icon: FileText },
  blog: { label: "Blog", icon: Newspaper },
  message: { label: "Mensajes", icon: MessageSquare },
};

const CommandPalette = ({ open, onOpenChange, items, onSelect }: Props) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<ContentHit[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Live content search
  useEffect(() => {
    const term = search.trim();
    if (!open || term.length < 2) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      const [svc, mch, veh, prj, blg, msg] = await Promise.all([
        supabase.from("services").select("id,title").ilike("title", like).limit(5),
        supabase.from("machinery").select("id,name").ilike("name", like).limit(5),
        supabase.from("vehicles").select("id,name").ilike("name", like).limit(5),
        supabase.from("projects").select("id,title").ilike("title", like).limit(5),
        supabase.from("blog_posts").select("id,title").ilike("title", like).limit(5),
        supabase.from("contact_messages").select("id,name,email").or(`name.ilike.${like},email.ilike.${like}`).limit(5),
      ]);
      if (ctrl.signal.aborted) return;
      const out: ContentHit[] = [];
      svc.data?.forEach((r: any) => out.push({ id: r.id, label: r.title, source: "service", tabId: "services" }));
      mch.data?.forEach((r: any) => out.push({ id: r.id, label: r.name, source: "machinery", tabId: "machinery" }));
      veh.data?.forEach((r: any) => out.push({ id: r.id, label: r.name, source: "vehicle", tabId: "vehicles" }));
      prj.data?.forEach((r: any) => out.push({ id: r.id, label: r.title, source: "project", tabId: "projects" }));
      blg.data?.forEach((r: any) => out.push({ id: r.id, label: r.title, source: "blog", tabId: "blog" }));
      msg.data?.forEach((r: any) => out.push({ id: r.id, label: `${r.name} · ${r.email}`, source: "message", tabId: "messages" }));
      setHits(out);
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [search, open]);

  const grouped = useMemo(
    () => items.reduce<Record<string, PaletteItem[]>>((acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    }, {}),
    [items]
  );

  const hitsGrouped = useMemo(() => {
    return hits.reduce<Record<string, ContentHit[]>>((acc, h) => {
      const k = SOURCE_META[h.source].label;
      (acc[k] ||= []).push(h);
      return acc;
    }, {});
  }, [hits]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar sección o contenido... (Ctrl+K)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No hay resultados.</CommandEmpty>

        {hits.length > 0 && (
          <>
            {Object.entries(hitsGrouped).map(([label, list]) => (
              <CommandGroup key={`hit-${label}`} heading={`Contenido · ${label}`}>
                {list.map((h) => {
                  const Icon = SOURCE_META[h.source].icon;
                  return (
                    <CommandItem
                      key={`${h.source}-${h.id}`}
                      value={`${label} ${h.label}`}
                      onSelect={() => {
                        onSelect(h.tabId);
                        onOpenChange(false);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4 opacity-70" />
                      <span className="truncate">{h.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            <CommandSeparator />
          </>
        )}

        {Object.entries(grouped).map(([category, list], idx) => (
          <div key={category}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {list.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${category} ${item.label}`}
                    onSelect={() => {
                      onSelect(item.id);
                      onOpenChange(false);
                    }}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Navegación">
          <CommandItem onSelect={() => { navigate("/"); onOpenChange(false); }}>
            Ir al sitio público
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/blog"); onOpenChange(false); }}>
            Ir al blog
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
