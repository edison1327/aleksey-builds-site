import { supabase } from "@/integrations/supabase/client";

export type PdfSettings = {
  id?: string;
  company_name: string;
  tagline?: string | null;
  primary_color: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
  footer_note?: string | null;
};

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
  company_name: "ALEKSEY · Ingeniería y Construcción",
  primary_color: "#1a1a1a",
};

const CACHE_KEY = "aleksey.pdf.settings.v1";
let cache: PdfSettings | null = null;

export function getCachedPdfSettings(): PdfSettings {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) { cache = JSON.parse(raw); return cache!; }
  } catch {}
  return DEFAULT_PDF_SETTINGS;
}

export async function loadPdfSettings(): Promise<PdfSettings> {
  const { data } = await supabase.from("pdf_settings" as any).select("*").limit(1).maybeSingle();
  const s = (data as any) || DEFAULT_PDF_SETTINGS;
  cache = s;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
  return s;
}

export async function savePdfSettings(s: PdfSettings): Promise<void> {
  const payload = { ...s };
  delete (payload as any).id;
  if (s.id) {
    const { error } = await supabase.from("pdf_settings" as any).update(payload).eq("id", s.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("pdf_settings" as any).insert(payload);
    if (error) throw error;
  }
  await loadPdfSettings();
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
