import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileText, Calculator, MessageSquare, LogOut, Plus, Clock, Check, Eye, Download, RotateCw } from "lucide-react";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Helmet } from "react-helmet-async";
import { downloadQuotePdf } from "@/lib/quotePdf";
import MessageThread from "@/components/MessageThread";
import { useToast } from "@/hooks/use-toast";

interface MyMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: string;
  created_at: string;
}

const isQuote = (m: MyMessage) => m.message.toLowerCase().includes("[cotizaci");

const statusBadge = (status: string) => {
  switch (status) {
    case "pending": return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    case "read": return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />En revisión</Badge>;
    case "responded": return <Badge className="bg-green-600"><Check className="h-3 w-3 mr-1" />Respondida</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const MyQuotesPage = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [openThread, setOpenThread] = useState<MyMessage | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/portal/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, name, email, phone, message, status, created_at, user_id")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order("created_at", { ascending: false });
      if (!error && data) setMessages(data as MyMessage[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleDownloadPdf = async (m: MyMessage) => {
    try {
      await downloadQuotePdf({
        companyName: "ALEKSEY",
        companyTagline: "Ingeniería y Construcción",
        quoteId: m.id,
        date: new Date(m.created_at),
        title: isQuote(m) ? "Solicitud de Cotización" : "Mensaje de Contacto",
        customer: { name: m.name, email: m.email, phone: m.phone || undefined },
        details: [
          { label: "Estado", value: m.status },
          { label: "Fecha", value: format(new Date(m.created_at), "PPp", { locale: es }) },
        ],
        message: m.message,
      }, `solicitud-${m.id.slice(0, 8)}.pdf`);
      toast({ title: "PDF descargado" });
    } catch (e: any) {
      toast({ title: "Error al generar PDF", description: e.message, variant: "destructive" });
    }
  };

  const handleReQuote = (m: MyMessage) => {
    // Extract original equipment hint and pre-fill quote
    navigate("/cotizar");
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const quotes = messages.filter(isQuote);
  const contacts = messages.filter((m) => !isQuote(m));
  const pending = messages.filter((m) => m.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mis solicitudes | Portal del cliente</title>
        <meta name="description" content="Consulta, descarga y chatea sobre tus solicitudes de cotización." />
      </Helmet>
      <section className="pt-32 pb-12 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary-foreground">Mis solicitudes</h1>
              <p className="text-secondary-foreground/80 mt-1">Hola, {user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Link to="/cotizar"><Button><Plus className="h-4 w-4 mr-1" /> Nueva cotización</Button></Link>
              <Button variant="outline" onClick={async () => { await signOut(); navigate("/"); }}>
                <LogOut className="h-4 w-4 mr-1" /> Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{messages.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-amber-600">{pending}</p><p className="text-xs text-muted-foreground">Pendientes</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-blue-600">{quotes.length}</p><p className="text-xs text-muted-foreground">Cotizaciones</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-purple-600">{contacts.length}</p><p className="text-xs text-muted-foreground">Mensajes</p></CardContent></Card>
          </div>

          {messages.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Aún no tienes solicitudes registradas.</p>
                <Link to="/cotizar"><Button>Solicitar primera cotización</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const quote = isQuote(m);
                return (
                  <Card key={m.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          {quote ? <Calculator className="h-5 w-5 text-blue-600" /> : <MessageSquare className="h-5 w-5 text-purple-600" />}
                          <CardTitle className="text-base">{quote ? "Solicitud de cotización" : "Mensaje de contacto"}</CardTitle>
                          {statusBadge(m.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{format(new Date(m.created_at), "PPp", { locale: es })}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <pre className="text-sm whitespace-pre-wrap font-sans line-clamp-6 text-muted-foreground">{m.message}</pre>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => setOpenThread(m)}>
                          <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(m)}>
                          <Download className="h-3.5 w-3.5 mr-1" /> PDF
                        </Button>
                        {quote && (
                          <Button size="sm" variant="ghost" onClick={() => handleReQuote(m)}>
                            <RotateCw className="h-3.5 w-3.5 mr-1" /> Re-cotizar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!openThread} onOpenChange={(v) => !v && setOpenThread(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conversación · {openThread && format(new Date(openThread.created_at), "PP", { locale: es })}</DialogTitle>
          </DialogHeader>
          {openThread && user && (
            <MessageThread
              messageId={openThread.id}
              currentUserId={user.id}
              currentUserName={user.email}
              asRole="customer"
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MyQuotesPage;
