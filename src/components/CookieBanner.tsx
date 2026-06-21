import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "aleksey_cookie_consent_v1";

type Consent = "accepted" | "rejected";

/**
 * Lightweight EU-friendly cookie banner.
 * - Only essential cookies are used until the user accepts.
 * - Choice is persisted in localStorage; no analytics are loaded otherwise.
 */
const CookieBanner = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!stored) {
      // Defer to avoid layout shift during initial paint
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (value: Consent) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      window.dispatchEvent(new CustomEvent("cookie-consent-change", { detail: value }));
    } catch {
      /* storage disabled */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border bg-card text-card-foreground shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-5 h-5 mt-0.5 text-primary shrink-0" aria-hidden="true" />
          <div className="text-sm leading-relaxed">
            <p className="font-heading font-semibold mb-1">Usamos cookies</p>
            <p className="text-muted-foreground">
              Utilizamos cookies esenciales para el funcionamiento del sitio y, con tu permiso,
              cookies de análisis para mejorar tu experiencia. Puedes aceptar o rechazar las no
              esenciales.{" "}
              <Link to="/privacidad" className="underline hover:text-primary">
                Más información
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => save("rejected")}>
            Rechazar
          </Button>
          <Button size="sm" onClick={() => save("accepted")}>
            Aceptar
          </Button>
          <button
            type="button"
            onClick={() => save("rejected")}
            aria-label="Cerrar aviso de cookies"
            className="text-muted-foreground hover:text-foreground p-1 rounded-md sm:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const getCookieConsent = (): Consent | null => {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "accepted" || v === "rejected" ? v : null;
};

export default CookieBanner;
