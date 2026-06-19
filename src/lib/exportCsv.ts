// Lightweight CSV export — no deps.
// Usage: exportCsv("messages.csv", rows, [{ key: "name", label: "Nombre" }, ...])

export type CsvColumn<T> = {
  key: keyof T | string;
  label: string;
  format?: (value: unknown, row: T) => string;
};

const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  let str = typeof value === "string" ? value : String(value);
  // Strip control chars that break Excel
  str = str.replace(/[\r\n]+/g, " ").replace(/\t/g, " ");
  if (/[",;]/.test(str)) str = `"${str.replace(/"/g, '""')}"`;
  return str;
};

export function exportCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = (row as unknown as Record<string, unknown>)[c.key as string];
          const v = c.format ? c.format(raw, row) : raw;
          return escapeCell(v);
        })
        .join(","),
    )
    .join("\n");

  // BOM so Excel reads UTF-8 properly
  const blob = new Blob(["\uFEFF" + header + "\n" + body], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
