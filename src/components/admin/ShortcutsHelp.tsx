import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts: Array<{ keys: string; description: string }> = [
  { keys: "Ctrl / ⌘ + K", description: "Abrir búsqueda global" },
  { keys: "?", description: "Mostrar esta ayuda" },
  { keys: "G luego D", description: "Ir a Dashboard" },
  { keys: "G luego M", description: "Ir a Mensajes" },
  { keys: "G luego P", description: "Ir a Pipeline" },
  { keys: "G luego I", description: "Ir a Bandeja de notificaciones" },
  { keys: "Esc", description: "Cerrar diálogos" },
];

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center px-2 py-0.5 rounded border border-border bg-muted text-xs font-mono text-foreground">
    {children}
  </kbd>
);

const ShortcutsHelp = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atajos de teclado</DialogTitle>
        </DialogHeader>
        <ul className="divide-y divide-border">
          {shortcuts.map((s) => (
            <li key={s.keys} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-foreground">{s.description}</span>
              <Kbd>{s.keys}</Kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsHelp;
