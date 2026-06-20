import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle2, LogIn, UserPlus } from "lucide-react";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const PortalLogin = () => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = tab === "login" ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (tab === "signup") {
      toast({
        title: "Cuenta creada",
        description: "Revisa tu correo para confirmar tu cuenta y luego inicia sesión.",
      });
      setTab("login");
      return;
    }
    toast({ title: "Bienvenido", description: "Sesión iniciada correctamente." });
    navigate("/mis-solicitudes");
  };

  return (
    <div className="min-h-dvh bg-background">
      <Helmet>
        <title>Portal del cliente | Acceso</title>
        <meta name="description" content="Inicia sesión o crea tu cuenta para hacer seguimiento de tus solicitudes de cotización." />
      </Helmet>
      <section className="pt-32 pb-20 min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto border-none shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Portal del cliente</CardTitle>
              <CardDescription>Accede para ver tus solicitudes de cotización</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="login"><LogIn className="h-4 w-4 mr-1" /> Iniciar sesión</TabsTrigger>
                  <TabsTrigger value="signup"><UserPlus className="h-4 w-4 mr-1" /> Crear cuenta</TabsTrigger>
                </TabsList>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" autoComplete={tab === "login" ? "current-password" : "new-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                    {tab === "signup" && (
                      <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres.</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {tab === "login" ? "Entrar" : "Crear cuenta"}
                  </Button>
                </form>
              </Tabs>
              <p className="text-xs text-muted-foreground text-center mt-6">
                <Link to="/cotizar" className="hover:text-primary">¿Solo quieres cotizar? Puedes hacerlo sin cuenta.</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PortalLogin;
