import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";

/**
 * Subtle install prompt — appears only after the browser fires beforeinstallprompt
 * (so it never shows on iOS Safari or already-installed contexts).
 * Delayed 8s to avoid competing with cookie banner / chat widget on first paint.
 */
const InstallAppBanner = () => {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canInstall) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(t);
  }, [canInstall]);

  if (!canInstall || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[80] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm text-foreground">
            Instala ALEKSEY
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Acceso rápido desde tu pantalla de inicio.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-8 text-xs" onClick={() => void promptInstall()}>
              Instalar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={dismiss}
            >
              Ahora no
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallAppBanner;
