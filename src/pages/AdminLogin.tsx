import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Mail, ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

const registerSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isStaff, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user && isStaff) {
      navigate("/admin");
    }
  }, [user, isStaff, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Error de autenticación",
          description: "Credenciales incorrectas o usuario no tiene permisos de administrador.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bienvenido",
          description: "Verificando permisos de administrador...",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Ocurrió un error al iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = registerSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Usuario existente",
            description: "Este email ya está registrado. Intenta iniciar sesión.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error de registro",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Registro exitoso",
          description: "Tu cuenta ha sido creada. Un administrador debe asignarte el rol de admin para acceder al panel.",
        });
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast({
        title: "Error",
        description: "Ocurrió un error al registrarse",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-secondary-foreground/70 hover:text-secondary-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al sitio
        </Link>
        
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-heading tracking-wide">
              Panel de Administración
            </CardTitle>
            <CardDescription>
              Ingresa o regístrate para acceder al CMS
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="admin@aleksey.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pl-10 bg-muted border-0 ${errors.email ? "ring-2 ring-destructive" : ""}`}
                        required
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`pl-10 bg-muted border-0 ${errors.password ? "ring-2 ring-destructive" : ""}`}
                        required
                      />
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "INGRESAR"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="register-email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pl-10 bg-muted border-0 ${errors.email ? "ring-2 ring-destructive" : ""}`}
                        required
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="register-password" className="text-sm font-medium text-foreground">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`pl-10 bg-muted border-0 ${errors.password ? "ring-2 ring-destructive" : ""}`}
                        required
                      />
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pl-10 bg-muted border-0 ${errors.confirmPassword ? "ring-2 ring-destructive" : ""}`}
                        required
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading tracking-wider"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registrando..." : "CREAR CUENTA"}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Después de registrarte, un administrador debe asignarte el rol de admin para acceder.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
