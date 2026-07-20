import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PasswordStrength from "@/components/admin/PasswordStrength";
import { evaluatePassword } from "@/lib/passwordPolicy";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase auto-processes the recovery token from the URL hash and fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // In case the event already fired (page opened via link)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

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
    toast({ title: "Contraseña actualizada", description: "Ya puedes iniciar sesión." });
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/admin/login" className="inline-flex items-center gap-2 text-secondary-foreground/70 hover:text-secondary-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver al login
        </Link>
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-heading tracking-wide">Nueva contraseña</CardTitle>
            <CardDescription>
              {ready ? "Ingresa tu nueva contraseña" : "Validando enlace de recuperación..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nueva contraseña</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required disabled={!ready} autoComplete="new-password" />
                <PasswordStrength password={password} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar contraseña</label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••" required disabled={!ready} autoComplete="new-password" />
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
                )}
              </div>
              <Button type="submit" className="w-full font-heading tracking-wider" disabled={!ready || loading || !valid || password !== confirm}>
                {loading ? "Actualizando..." : "ACTUALIZAR CONTRASEÑA"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
