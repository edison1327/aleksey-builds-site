import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MfaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EnrolledFactor {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: string;
}

const MfaSetupDialog = ({ open, onOpenChange }: MfaSetupDialogProps) => {
  const { toast } = useToast();
  const [factors, setFactors] = useState<EnrolledFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      setFactors(data.all as EnrolledFactor[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      refresh();
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setCode("");
    }
  }, [open]);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setEnrolling(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
  };

  const verifyEnroll = async () => {
    if (!factorId) return;
    setEnrolling(true);
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr || !challenge) {
      setEnrolling(false);
      toast({ title: "Error", description: challengeErr?.message ?? "Challenge falló", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    setEnrolling(false);
    if (error) {
      toast({ title: "Código incorrecto", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "2FA activado", description: "La autenticación en dos pasos está habilitada." });
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setCode("");
    refresh();
  };

  const unenroll = async (id: string) => {
    if (!confirm("¿Quitar este factor 2FA?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Factor eliminado" });
    refresh();
  };

  const verifiedFactors = factors.filter((f) => f.status === "verified");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Autenticación en dos pasos
          </DialogTitle>
          <DialogDescription>
            Añade una capa extra de seguridad usando una app TOTP (Google Authenticator, 1Password, Authy).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estado actual</Label>
              {verifiedFactors.length === 0 ? (
                <Badge variant="outline" className="gap-1">
                  <ShieldOff className="h-3 w-3" /> 2FA desactivado
                </Badge>
              ) : (
                <div className="space-y-2">
                  {verifiedFactors.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-md border p-2">
                      <div className="flex items-center gap-2">
                        <Badge className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          {f.factor_type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{f.friendly_name || "Sin nombre"}</span>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => unenroll(f.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {qrCode ? (
              <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                <p className="text-sm">Escanea con tu app TOTP:</p>
                <div className="flex justify-center bg-white p-3 rounded">
                  <img src={qrCode} alt="QR 2FA" className="h-40 w-40" />
                </div>
                {secret && (
                  <div className="text-xs text-muted-foreground">
                    O introduce manualmente: <code className="font-mono bg-background px-1 rounded">{secret}</code>
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="code">Código de 6 dígitos</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                  />
                </div>
                <Button onClick={verifyEnroll} disabled={code.length !== 6 || enrolling} className="w-full">
                  {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verificar y activar
                </Button>
              </div>
            ) : (
              <Button onClick={startEnroll} disabled={enrolling} className="w-full">
                {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {verifiedFactors.length ? "Añadir otro factor" : "Activar 2FA"}
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MfaSetupDialog;
