import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const BRAND = "ALEKSEY · Ingeniería y Construcción";

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(BRAND, 14, 14);
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.text(title, 14, 34);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(subtitle, 14, 41);
    doc.setTextColor(0);
  }
}

function footer(doc: jsPDF) {
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Generado ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}  ·  Página ${i}/${pages}`,
      14,
      doc.internal.pageSize.getHeight() - 8,
    );
  }
}

export type CalendarPdfItem = {
  date: string;
  kind: "Reserva" | "Mantenimiento";
  title: string;
  detail: string;
  status?: string;
};

export function exportCalendarPdf(
  rangeLabel: string,
  items: CalendarPdfItem[],
  conflicts: number,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Calendario operativo", rangeLabel);
  let y = 50;
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
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.text(it.date, 14, y);
    doc.text(it.kind, 44, y);
    doc.text(doc.splitTextToSize(it.title, 58), 78, y);
    doc.text(doc.splitTextToSize(it.detail + (it.status ? ` [${it.status}]` : ""), 56), 138, y);
    y += 8;
  }

  footer(doc);
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

export function exportWorkOrderPdf(wo: WorkOrderPdf) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, `Orden de trabajo ${wo.code}`, wo.title);
  let y = 50;

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

  footer(doc);
  doc.save(`OT-${wo.code}.pdf`);
}
