import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], desc: "Ir a Cotizar" },
  { keys: ["Ctrl", "J"], desc: "Alternar modo oscuro" },
  { keys: ["Ctrl", "/"], desc: "Ir al inicio" },
  { keys: ["Shift", "?"], desc: "Mostrar esta ayuda" },
  { keys: ["Esc"], desc: "Cerrar diálogos y menús" },
  { keys: ["Tab"], desc: "Navegar entre elementos" },
];

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-md border border-border bg-muted text-foreground text-xs font-mono font-semibold shadow-sm">
    {children}
  </kbd>
);

const ShortcutsHelpDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-shortcuts-help", handler);
    return () => window.removeEventListener("open-shortcuts-help", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
            Atajos de teclado
          </DialogTitle>
          <DialogDescription>
            Navega más rápido por el sitio con estas combinaciones.
          </DialogDescription>
        </DialogHeader>

        <ul className="divide-y divide-border" role="list">
          {SHORTCUTS.map((s) => (
            <li key={s.desc} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-foreground">{s.desc}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground text-xs">+</span>}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          En macOS, usa <Kbd>⌘</Kbd> en lugar de <Kbd>Ctrl</Kbd>.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsHelpDialog;
