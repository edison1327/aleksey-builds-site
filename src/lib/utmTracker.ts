// Capture UTM params and landing page on first visit; persist in localStorage.
const KEY = "aleksey_attribution";

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page?: string;
  captured_at?: string;
};

export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return;
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
    const data: Attribution = { landing_page: window.location.pathname, captured_at: new Date().toISOString() };
    let has = false;
    keys.forEach((k) => {
      const v = params.get(k);
      if (v) { (data as any)[k] = v; has = true; }
    });
    if (has || window.document.referrer) {
      if (!has && document.referrer) data.utm_source = new URL(document.referrer).hostname;
      localStorage.setItem(KEY, JSON.stringify(data));
    }
  } catch {}
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
