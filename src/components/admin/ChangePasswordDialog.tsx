import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import PasswordStrength from "./PasswordStrength";
import { evaluatePassword } from "@/lib/passwordPolicy";


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const ChangePasswordDialog = ({ open, onOpenChange }: Props) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { valid } = evaluatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast({ title: "Contraseña insegura", description: "Cumple todos los requisitos antes de continuar.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "No coinciden", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Contraseña actualizada" });
    setPassword(""); setConfirm("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>Elige una contraseña fuerte que cumpla todos los requisitos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nueva contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            <PasswordStrength password={password} />
          </div>
          <div className="space-y-2">
            <Label>Confirmar contraseña</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
            {confirm.length > 0 && confirm !== password && (
              <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || !valid || password !== confirm}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
