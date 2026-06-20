import i18n from "@/i18n/config";

/**
 * Devuelve la traducción de un campo de la base de datos.
 *
 * Convención: el campo en español se llama `field` y el inglés `field_en`.
 * Si el idioma activo es `en` y `field_en` está vacío, hace fallback al ES.
 *
 * Soporta strings, arrays (text[] / jsonb arrays) y objetos jsonb.
 */
export function getI18nField<T = any>(
  row: Record<string, any> | null | undefined,
  field: string,
  lang?: string,
): T {
  if (!row) return undefined as unknown as T;
  const lng = (lang ?? i18n.resolvedLanguage ?? i18n.language ?? "es").slice(0, 2);
  if (lng === "en") {
    const en = row[`${field}_en`];
    if (en !== null && en !== undefined && !isEmpty(en)) return en as T;
  }
  return row[field] as T;
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

/** Traduce un array de filas en un campo concreto, devolviendo el array original con el campo reemplazado. */
export function mapI18nField<T extends Record<string, any>>(
  rows: T[] | null | undefined,
  field: keyof T & string,
  lang?: string,
): T[] {
  if (!rows) return [];
  return rows.map((r) => ({ ...r, [field]: getI18nField(r, field, lang) }));
}
