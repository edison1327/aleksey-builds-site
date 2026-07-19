import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportInvoicePdf } from "@/lib/pdfExport";

interface Invoice {
  id: string;
  code: string;
  issue_date: string;
  due_date: string | null;
  currency: string;
  total: number;
  amount_paid: number | null;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_tax_id: string | null;
  notes: string | null;
  terms: string | null;
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    draft: "bg-gray-500",
    sent: "bg-blue-600",
    partial: "bg-amber-500",
    paid: "bg-green-600",
    overdue: "bg-red-600",
    cancelled: "bg-slate-500",
  };
  const label: Record<string, string> = {
    draft: "Borrador",
    sent: "Enviada",
    partial: "Pago parcial",
    paid: "Pagada",
    overdue: "Vencida",
    cancelled: "Cancelada",
  };
  return <Badge className={map[s] || ""}>{label[s] || s}</Badge>;
};

interface Props {
  email: string;
}

const ClientInvoices = ({ email }: Props) => {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("invoices")
        .select("id, code, issue_date, due_date, currency, total, amount_paid, status, customer_name, customer_email, customer_address, customer_tax_id, notes, terms")
        .ilike("customer_email", email)
        .order("issue_date", { ascending: false });
      setRows((data as Invoice[]) ?? []);
      setLoading(false);
    };
    load();
  }, [email]);

  const handleDownload = async (inv: Invoice) => {
    const { data: items } = await (supabase as any)
      .from("invoice_items")
      .select("description, quantity, unit_price, subtotal")
      .eq("invoice_id", inv.id);
    const mapped = ((items as any[]) ?? []).map((it) => ({
      description: it.description,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      total: Number(it.subtotal),
    }));
    await exportInvoicePdf({
      code: inv.code,
      issue_date: inv.issue_date,
      due_date: inv.due_date || inv.issue_date,
      currency: inv.currency,
      customer_name: inv.customer_name || "",
      customer_email: inv.customer_email,
      customer_tax_id: inv.customer_tax_id,
      customer_address: inv.customer_address,
      items: mapped,
      subtotal: mapped.reduce((s, i) => s + i.total, 0),
      tax_rate: 0,
      tax_amount: 0,
      total: Number(inv.total),
      amount_paid: Number(inv.amount_paid || 0),
      status: inv.status,
      notes: inv.notes,
      terms: inv.terms,
    });
  };

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (rows.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No tienes facturas.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((inv) => {
        const pending = Number(inv.total) - Number(inv.amount_paid || 0);
        return (
          <Card key={inv.id}>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{inv.code}</span>
                  {statusBadge(inv.status)}
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{Number(inv.total).toLocaleString()} {inv.currency}</div>
                  {pending > 0 && inv.status !== "cancelled" && (
                    <div className="text-xs text-red-600 font-medium">Pendiente: {pending.toLocaleString()} {inv.currency}</div>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                <span>Emitida: {format(new Date(inv.issue_date), "PP", { locale: es })}</span>
                {inv.due_date && <span>Vence: {format(new Date(inv.due_date), "PP", { locale: es })}</span>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleDownload(inv)}>
                  <Download className="h-4 w-4 mr-1" />PDF
                </Button>
                {pending > 0 && inv.status !== "cancelled" && (
                  <Button size="sm" variant="secondary" disabled title="Próximamente: pagos online">
                    <CreditCard className="h-4 w-4 mr-1" />Pagar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ClientInvoices;
