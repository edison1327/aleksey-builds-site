import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileSignature, PenLine, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportContractPdf } from "@/lib/pdfExport";

interface Contract {
  id: string;
  code: string;
  title: string;
  status: string;
  amount: number | null;
  currency: string | null;
  sign_token: string | null;
  sent_at: string | null;
  signed_at: string | null;
  body: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_document: string | null;
  customer_address: string | null;
  signature_data_url: string | null;
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    draft: "bg-gray-500",
    sent: "bg-amber-500",
    signed: "bg-green-600",
    cancelled: "bg-red-600",
  };
  const label: Record<string, string> = {
    draft: "Borrador",
    sent: "Pendiente de firma",
    signed: "Firmado",
    cancelled: "Cancelado",
  };
  return <Badge className={map[s] || ""}>{label[s] || s}</Badge>;
};

interface Props {
  email: string;
}

const ClientContracts = ({ email }: Props) => {
  const [rows, setRows] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("contracts")
        .select("id, code, title, status, amount, currency, sign_token, sent_at, signed_at, body, customer_name, customer_email, customer_document, customer_address, signature_data_url")
        .ilike("customer_email", email)
        .order("created_at", { ascending: false });
      setRows((data as Contract[]) ?? []);
      setLoading(false);
    };
    load();
  }, [email]);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (rows.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <FileSignature className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No tienes contratos.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((c) => (
        <Card key={c.id}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                <span className="font-semibold">{c.code}</span>
                {statusBadge(c.status)}
              </div>
              {c.amount != null && (
                <div className="font-bold">{Number(c.amount).toLocaleString()} {c.currency || ""}</div>
              )}
            </div>
            <div className="text-sm font-medium">{c.title}</div>
            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
              {c.sent_at && <span>Enviado: {format(new Date(c.sent_at), "PP", { locale: es })}</span>}
              {c.signed_at && <span>Firmado: {format(new Date(c.signed_at), "PP", { locale: es })}</span>}
            </div>
            <div className="flex gap-2 pt-2 flex-wrap">
              {c.status === "sent" && c.sign_token && (
                <Button size="sm" asChild>
                  <Link to={`/firmar/${c.sign_token}`}>
                    <PenLine className="h-4 w-4 mr-1" />Firmar ahora
                  </Link>
                </Button>
              )}
              {c.status === "signed" && (
                <Button size="sm" variant="outline" onClick={() => exportContractPdf(c as any)}>
                  <Download className="h-4 w-4 mr-1" />PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientContracts;
