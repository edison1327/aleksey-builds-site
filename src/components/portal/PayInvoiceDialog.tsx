import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2 } from "lucide-react";

interface Props {
  invoiceId: string;
  invoiceCode: string;
  pending: number;
  currency: string;
  customerName: string;
  customerEmail: string;
}

const PayInvoiceDialog = ({ invoiceId, invoiceCode, pending, currency, customerName, customerEmail }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState(pending.toFixed(2));
  const [method, setMethod] = useState("transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({ title: "Monto inválido", variant: "destructive" });
      return;
    }
    setSaving(true);
    const msg = `Aviso de pago factura ${invoiceCode}\nCliente: ${customerName} (${customerEmail})\nMonto: ${amount} ${currency}\nMétodo: ${method}\nReferencia: ${reference || "—"}\nNotas: ${notes || "—"}`;
    const { error } = await supabase.from("contact_messages").insert({
      name: customerName,
      email: customerEmail,
      subject: `Aviso de pago — ${invoiceCode}`,
      message: msg,
      source: "portal_pago",
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aviso enviado", description: "Confirmaremos tu pago en breve." });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <CreditCard className="h-4 w-4 mr-1" />Pagar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar factura {invoiceCode}</DialogTitle>
          <DialogDescription>
            Registra tu pago para que nuestro equipo lo confirme. Saldo pendiente: <strong>{pending.toLocaleString()} {currency}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Monto ({currency})</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Método</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                <SelectItem value="yape">Yape / Plin</SelectItem>
                <SelectItem value="deposit">Depósito</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>N.° de operación / referencia</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar aviso de pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayInvoiceDialog;
