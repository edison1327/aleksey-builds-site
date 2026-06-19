import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  variant?: "compact" | "full";
}

const LanguageSwitcher = ({ className, variant = "compact" }: Props) => {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || "es").slice(0, 2);

  const toggle = () => {
    const next = current === "es" ? "en" : "es";
    i18n.changeLanguage(next);
    try {
      localStorage.setItem("i18nextLng", next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Change language"
      title={current === "es" ? "Switch to English" : "Cambiar a Español"}
      className={cn(
        "group relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-heading tracking-wide text-secondary-foreground/80 hover:text-primary-foreground hover:bg-primary transition-all duration-300",
        className
      )}
    >
      <Languages className="h-4 w-4" />
      <span className="uppercase font-bold">{current}</span>
      {variant === "full" && (
        <span className="text-xs opacity-60">/ {current === "es" ? "EN" : "ES"}</span>
      )}
    </button>
  );
};

export default LanguageSwitcher;
