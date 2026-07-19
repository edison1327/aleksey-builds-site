import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getCachedPdfSettings, hexToRgb, type PdfSettings } from "./pdfSettings";

async function fetchLogoDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function header(doc: jsPDF, title: string, subtitle: string | undefined, s: PdfSettings) {
  const [r, g, b] = hexToRgb(s.primary_color || "#1a1a1a");
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 24, "F");

  const logo = await fetchLogoDataUrl(s.logo_url);
  let textX = 14;
  if (logo) {
    try { doc.addImage(logo, "PNG", 12, 5, 14, 14); textX = 30; } catch {}
  }

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(s.company_name, textX, 12);
  if (s.tagline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(s.tagline, textX, 18);
  }
  const contactBits = [s.phone, s.email, s.website].filter(Boolean).join("  ·  ");
  if (contactBits) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const w = doc.getTextWidth(contactBits);
    doc.text(contactBits, doc.internal.pageSize.getWidth() - 14 - w, 12);
  }
  if (s.address) {
    const w = doc.getTextWidth(s.address);
    doc.text(s.address, doc.internal.pageSize.getWidth() - 14 - w, 18);
  }

  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 36);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(subtitle, 14, 43);
    doc.setTextColor(0);
  }
}

function footer(doc: jsPDF, s: PdfSettings) {
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    const gen = `Generado ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}  ·  Página ${i}/${pages}`;
    doc.text(gen, 14, doc.internal.pageSize.getHeight() - 8);
    if (s.footer_note) {
      const w = doc.getTextWidth(s.footer_note);
      doc.text(s.footer_note, doc.internal.pageSize.getWidth() - 14 - w, doc.internal.pageSize.getHeight() - 8);
    }
  }
}

export type CalendarPdfItem = {
  date: string;
  kind: "Reserva" | "Mantenimiento";
  title: string;
  detail: string;
  status?: string;
};

export async function exportCalendarPdf(
  rangeLabel: string,
  items: CalendarPdfItem[],
  conflicts: number,
) {
  const s = getCachedPdfSettings();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await header(doc, "Calendario operativo", rangeLabel, s);
  let y = 52;
  doc.setFontSize(10);
  doc.text(`Eventos: ${items.length}   ·   Conflictos: ${conflicts}`, 14, y);
  y += 6;
  doc.setDrawColor(220);
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Fecha", 14, y);
  doc.text("Tipo", 44, y);
  doc.text("Equipo / Título", 78, y);
  doc.text("Detalle", 138, y);
  doc.setFont("helvetica", "normal");
  y += 5;

  for (const it of items) {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.text(it.date, 14, y);
    doc.text(it.kind, 44, y);
    doc.text(doc.splitTextToSize(it.title, 58), 78, y);
    doc.text(doc.splitTextToSize(it.detail + (it.status ? ` [${it.status}]` : ""), 56), 138, y);
    y += 8;
  }

  footer(doc, s);
  doc.save(`calendario-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`);
}

export type WorkOrderPdf = {
  code: string;
  title: string;
  description?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  site_address?: string | null;
  status: string;
  priority: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  checklist?: { label: string; done: boolean }[];
  notes?: string | null;
};

export async function exportWorkOrderPdf(wo: WorkOrderPdf) {
  const s = getCachedPdfSettings();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await header(doc, `Orden de trabajo ${wo.code}`, wo.title, s);
  let y = 52;

  const row = (label: string, value?: string | null) => {
    if (!value) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(value, 130);
    doc.text(lines, 60, y);
    y += 6 + (lines.length - 1) * 5;
  };

  row("Estado", wo.status);
  row("Prioridad", wo.priority);
  row("Cliente", wo.customer_name);
  row("Contacto", [wo.customer_phone, wo.customer_email].filter(Boolean).join(" · "));
  row("Dirección", wo.site_address);
  row("Programada", [
    wo.scheduled_start ? format(new Date(wo.scheduled_start), "dd/MM/yyyy HH:mm", { locale: es }) : null,
    wo.scheduled_end ? "→ " + format(new Date(wo.scheduled_end), "dd/MM/yyyy HH:mm", { locale: es }) : null,
  ].filter(Boolean).join(" ") || null);
  if (wo.estimated_cost != null) row("Costo estimado", `S/ ${Number(wo.estimated_cost).toFixed(2)}`);
  if (wo.actual_cost != null) row("Costo real", `S/ ${Number(wo.actual_cost).toFixed(2)}`);

  if (wo.description) {
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Descripción", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(wo.description, 180);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 3;
  }

  if (wo.checklist?.length) {
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Checklist", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const t of wo.checklist) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.rect(14, y - 3.5, 4, 4);
      if (t.done) {
        doc.setLineWidth(0.5);
        doc.line(14.5, y - 1.5, 17.5, y - 3);
      }
      doc.text(doc.splitTextToSize(t.label, 170), 22, y);
      y += 6;
    }
  }

  if (wo.notes) {
    y += 3;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text("Notas", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(wo.notes, 180);
    doc.text(lines, 14, y);
  }

  doc.line(14, 275, 90, 275);
  doc.setFontSize(9);
  doc.text("Firma responsable", 14, 280);
  doc.line(120, 275, 196, 275);
  doc.text("Firma cliente / conformidad", 120, 280);

  footer(doc, s);
  doc.save(`OT-${wo.code}.pdf`);
}
