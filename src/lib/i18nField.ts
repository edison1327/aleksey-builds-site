import { useTranslation } from "react-i18next";

export function useLocalizedField() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "es").slice(0, 2);
  return function pick<T extends Record<string, any>>(
    item: T | null | undefined,
    field: keyof T & string
  ): string {
    if (!item) return "";
    if (lang === "en") {
      const en = (item as any)[`${field}_en`];
      if (en && String(en).trim().length > 0) return String(en);
    }
    const val = (item as any)[field];
    return val == null ? "" : String(val);
  };
}

export function pickLocalized<T extends Record<string, any>>(
  item: T | null | undefined,
  field: keyof T & string,
  lang: string
): string {
  if (!item) return "";
  if (lang === "en") {
    const en = (item as any)[`${field}_en`];
    if (en && String(en).trim().length > 0) return String(en);
  }
  const val = (item as any)[field];
  return val == null ? "" : String(val);
}
