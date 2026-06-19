import { jsPDF } from "jspdf";

export type QuotePdfInput = {
  // Header
  companyName?: string;
  companyTagline?: string;
  companyContact?: { phone?: string; email?: string; address?: string };
  logoUrl?: string;

  // Quote meta
  quoteId?: string;
  date?: Date;
  title?: string;

  // Customer
  customer: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    location?: string;
  };

  // Body details
  details: Array<{ label: string; value: string }>;
  message?: string;

  // Optional pricing
  pricing?: {
    items?: Array<{ description: string; qty: number; unit: string; total: number }>;
    currency?: string;
    notes?: string;
  };
};

const PRIMARY: [number, number, number] = [234, 88, 12]; // orange-600
const MUTED: [number, number, number] = [120, 120, 120];
const DARK: [number, number, number] = [30, 30, 30];

export async function generateQuotePdf(data: QuotePdfInput): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header band
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(data.companyName || "ALEKSEY", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.companyTagline || "Ingeniería y Construcción", margin, 50);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN", pageWidth - margin, 32, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const dateStr = (data.date || new Date()).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Fecha: ${dateStr}`, pageWidth - margin, 48, { align: "right" });
  if (data.quoteId) {
    doc.text(`Ref: ${data.quoteId.slice(0, 8).toUpperCase()}`, pageWidth - margin, 62, {
      align: "right",
    });
  }

  y = 100;
  doc.setTextColor(...DARK);

  if (data.title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(data.title, margin, y);
    y += 20;
  }

  // Customer block
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 90, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("CLIENTE", margin + 14, y + 18);
  doc.setTextColor(...DARK);
  doc.setFontSize(11);
  doc.text(data.customer.name, margin + 14, y + 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines: string[] = [];
  if (data.customer.company) lines.push(`Empresa: ${data.customer.company}`);
  lines.push(`Email: ${data.customer.email}`);
  if (data.customer.phone) lines.push(`Tel: ${data.customer.phone}`);
  if (data.customer.location) lines.push(`Proyecto en: ${data.customer.location}`);
  lines.forEach((l, i) => doc.text(l, margin + 14, y + 52 + i * 12));
  y += 110;

  // Details table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("DETALLES", margin, y);
  y += 12;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const colLabel = margin;
  const colValue = margin + 160;
  data.details.forEach(({ label, value }) => {
    if (y > 740) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.text(label, colLabel, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(value || "—", pageWidth - colValue - margin);
    doc.text(wrapped, colValue, y);
    y += Math.max(16, wrapped.length * 12);
  });

  // Pricing table
  if (data.pricing?.items && data.pricing.items.length > 0) {
    y += 14;
    if (y > 680) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("PROPUESTA ECONÓMICA", margin, y);
    y += 14;

    doc.setFillColor(...PRIMARY);
    doc.rect(margin, y, pageWidth - margin * 2, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("Descripción", margin + 10, y + 15);
    doc.text("Cant.", margin + 280, y + 15);
    doc.text("Unidad", margin + 330, y + 15);
    doc.text("Total", pageWidth - margin - 10, y + 15, { align: "right" });
    y += 22;

    let grand = 0;
    const currency = data.pricing.currency || "S/.";
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "normal");
    data.pricing.items.forEach((it, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, pageWidth - margin * 2, 20, "F");
      }
      doc.text(doc.splitTextToSize(it.description, 250), margin + 10, y + 14);
      doc.text(String(it.qty), margin + 280, y + 14);
      doc.text(it.unit, margin + 330, y + 14);
      doc.text(`${currency} ${it.total.toFixed(2)}`, pageWidth - margin - 10, y + 14, {
        align: "right",
      });
      grand += it.total;
      y += 20;
    });
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL", margin + 10, y + 4);
    doc.setTextColor(...PRIMARY);
    doc.text(`${currency} ${grand.toFixed(2)}`, pageWidth - margin - 10, y + 4, {
      align: "right",
    });
    y += 24;
    if (data.pricing.notes) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      const noteLines = doc.splitTextToSize(data.pricing.notes, pageWidth - margin * 2);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 11 + 6;
    }
  }

  if (data.message) {
    if (y > 720) {
      doc.addPage();
      y = margin;
    }
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("MENSAJE DEL CLIENTE", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const msg = doc.splitTextToSize(data.message, pageWidth - margin * 2);
    doc.text(msg, margin, y);
    y += msg.length * 12;
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(2);
    doc.line(margin, 800, pageWidth - margin, 800);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    const c = data.companyContact;
    const footerLeft = [c?.address, c?.phone, c?.email].filter(Boolean).join(" · ");
    if (footerLeft) doc.text(footerLeft, margin, 814);
    doc.text(`Página ${p} de ${pageCount}`, pageWidth - margin, 814, { align: "right" });
  }

  return doc;
}

export async function downloadQuotePdf(data: QuotePdfInput, filename = "cotizacion.pdf") {
  const doc = await generateQuotePdf(data);
  doc.save(filename);
}
