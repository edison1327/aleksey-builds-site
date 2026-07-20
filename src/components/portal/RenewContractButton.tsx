import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2 } from "lucide-react";

interface Props {
  contractCode: string;
  customerName: string;
  customerEmail: string;
}

const RenewContractButton = ({ contractCode, customerName, customerEmail }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: customerName,
      email: customerEmail,
      subject: `Renovación de contrato — ${contractCode}`,
      message: `Solicito renovar el contrato ${contractCode}.\n${notes ? `Notas: ${notes}` : ""}`,
      source: "portal_renovacion",
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Solicitud enviada", description: "Te contactaremos con la propuesta de renovación." });
    setOpen(false);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-1" />Renovar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renovar contrato {contractCode}</DialogTitle>
          <DialogDescription>Enviaremos tu solicitud al equipo comercial.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Cambios o comentarios (opcional)</Label>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: extender por 12 meses más, ajustar alcance, etc." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Solicitar renovación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenewContractButton;
