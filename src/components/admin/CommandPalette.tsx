import { useEffect } from "react";
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

export interface PaletteItem {
  id: string;
  label: string;
  category: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PaletteItem[];
  onSelect: (id: string) => void;
}

const CommandPalette = ({ open, onOpenChange, items, onSelect }: Props) => {
  const navigate = useNavigate();

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

  const grouped = items.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar sección, página o acción... (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>No hay resultados.</CommandEmpty>
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
