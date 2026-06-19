import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const ThemeToggle = ({ className }: Props) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-pressed={isDark}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-xl",
        "text-secondary-foreground hover:bg-secondary-foreground/10",
        "transition-all duration-300",
        className
      )}
    >
      <Sun
        className={cn(
          "h-5 w-5 absolute transition-all duration-500",
          isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        )}
      />
      <Moon
        className={cn(
          "h-5 w-5 absolute transition-all duration-500",
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
        )}
      />
    </button>
  );
};

export default ThemeToggle;
