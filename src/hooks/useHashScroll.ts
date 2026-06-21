import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the element matching the URL hash once it appears in the DOM.
 * Retries a few times to wait for async-loaded content (e.g. from Supabase).
 */
export function useHashScroll(deps: unknown[] = []) {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let tries = 0;
    let raf = 0;

    const tick = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background");
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background");
        }, 2200);
        return;
      }
      if (tries++ < 40) {
        raf = window.setTimeout(tick, 100);
      }
    };

    tick();
    return () => {
      if (raf) window.clearTimeout(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, ...deps]);
}
