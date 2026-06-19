import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";

/**
 * Atajos globales de teclado:
 * - Ctrl/Cmd + K: ir a Cotizar
 * - Ctrl/Cmd + J: alternar modo oscuro
 * - Ctrl/Cmd + /: ir a inicio
 * - Shift + ?: mostrar ayuda
 * - Esc: cerrar diálogos/menús (manejado por Radix)
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const { toggleTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    };

    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      // Ignorar si el usuario está escribiendo
      if (isEditable(e.target) && !mod) return;

      // Ctrl/Cmd + K → cotizar
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        navigate("/cotizar");
        return;
      }
      // Ctrl/Cmd + J → toggle tema
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggleTheme();
        toast.success(
          resolvedTheme === "dark" ? "Modo claro activado" : "Modo oscuro activado"
        );
        return;
      }
      // Ctrl/Cmd + / → inicio
      if (mod && e.key === "/") {
        e.preventDefault();
        navigate("/");
        return;
      }
      // Shift + ? → ayuda
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-shortcuts-help"));
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, toggleTheme, resolvedTheme]);
}
