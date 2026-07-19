import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, CalendarRange, FileSignature, ClipboardList, LogOut, Plus, MessageSquare, Receipt, History } from "lucide-react";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import ClientBookings from "@/components/portal/ClientBookings";
import ClientDocuments from "@/components/portal/ClientDocuments";
import ClientInvoices from "@/components/portal/ClientInvoices";
import ClientContracts from "@/components/portal/ClientContracts";
import ClientWorkOrders from "@/components/portal/ClientWorkOrders";
import ClientServiceHistory from "@/components/portal/ClientServiceHistory";

interface Summary {
  quotes: number;
  activeBookings: number;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
  contractsToSign: number;
  activeWorkOrders: number;
}

const MyAccountPage = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    quotes: 0, activeBookings: 0, pendingInvoices: 0, pendingInvoicesAmount: 0, contractsToSign: 0, activeWorkOrders: 0,
  });

  useEffect(() => {
    if (!isLoading && !user) navigate("/portal/login");
  }, [user, isLoading, navigate]);

  const email = user?.email || "";

  useEffect(() => {
    if (!email) return;
    (async () => {
      const [msgs, bookings, invoices, contracts, wos] = await Promise.all([
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("email", email),
        supabase.from("equipment_bookings").select("id", { count: "exact", head: true }).eq("customer_email", email).in("status", ["pending", "confirmed"]),
        (supabase as any).from("invoices").select("total, amount_paid, status").ilike("customer_email", email),
        (supabase as any).from("contracts").select("id", { count: "exact", head: true }).ilike("customer_email", email).eq("status", "sent"),
        (supabase as any).from("work_orders").select("id", { count: "exact", head: true }).ilike("customer_email", email).in("status", ["pending", "in_progress", "scheduled"]),
      ]);

      const invRows = ((invoices as any).data ?? []) as any[];
      const pending = invRows.filter((r) => r.status !== "paid" && r.status !== "cancelled");
      const pendingAmt = pending.reduce((s, r) => s + (Number(r.total) - Number(r.amount_paid || 0)), 0);

      setSummary({
        quotes: (msgs as any).count ?? 0,
        activeBookings: (bookings as any).count ?? 0,
        pendingInvoices: pending.length,
        pendingInvoicesAmount: pendingAmt,
        contractsToSign: (contracts as any).count ?? 0,
        activeWorkOrders: (wos as any).count ?? 0,
      });
      setLoading(false);
    })();
  }, [email]);

  const displayName = useMemo(() => {
    const m = user?.user_metadata as any;
    return m?.full_name || m?.name || user?.email?.split("@")[0] || "Cliente";
  }, [user]);

  if (isLoading || !user) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Helmet>
        <title>Mi cuenta — Portal del cliente</title>
        <meta name="description" content="Panel personal: solicitudes, reservas, facturas, contratos y órdenes de trabajo." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="min-h-dvh pt-24 pb-16 bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Hola, {displayName}</h1>
              <p className="text-muted-foreground mt-1">Aquí tienes el resumen de tu actividad con nosotros.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link to={`/cotizar?nombre=${encodeURIComponent(displayName)}&email=${encodeURIComponent(email)}`}>
                  <Plus className="h-4 w-4 mr-2" />Nueva solicitud
                </Link>
              </Button>
              <Button variant="outline" onClick={() => signOut().then(() => navigate("/"))}>
                <LogOut className="h-4 w-4 mr-2" />Salir
              </Button>
            </div>
          </div>

          {/* Summary cards */}
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              <SummaryCard icon={<MessageSquare className="h-5 w-5" />} label="Solicitudes" value={summary.quotes} />
              <SummaryCard icon={<CalendarRange className="h-5 w-5" />} label="Reservas activas" value={summary.activeBookings} />
              <SummaryCard icon={<FileSignature className="h-5 w-5" />} label="Contratos por firmar" value={summary.contractsToSign} highlight={summary.contractsToSign > 0} />
              <SummaryCard icon={<ClipboardList className="h-5 w-5" />} label="OT activas" value={summary.activeWorkOrders} />
              <SummaryCard icon={<Receipt className="h-5 w-5" />} label="Facturas pendientes" value={summary.pendingInvoices} highlight={summary.pendingInvoices > 0} />
              <SummaryCard icon={<FileText className="h-5 w-5" />} label="Saldo por pagar" value={summary.pendingInvoicesAmount.toLocaleString()} highlight={summary.pendingInvoicesAmount > 0} />
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="invoices">
            <TabsList className="grid grid-cols-2 md:grid-cols-6 mb-4 h-auto">
              <TabsTrigger value="invoices">Facturas</TabsTrigger>
              <TabsTrigger value="contracts">Contratos</TabsTrigger>
              <TabsTrigger value="workorders">Órdenes de trabajo</TabsTrigger>
              <TabsTrigger value="history"><History className="h-3 w-3 mr-1" />Historial</TabsTrigger>
              <TabsTrigger value="bookings">Reservas</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices"><ClientInvoices email={email} /></TabsContent>
            <TabsContent value="contracts"><ClientContracts email={email} /></TabsContent>
            <TabsContent value="workorders"><ClientWorkOrders email={email} /></TabsContent>
            <TabsContent value="history"><ClientServiceHistory email={email} /></TabsContent>
            <TabsContent value="bookings"><ClientBookings email={email} /></TabsContent>
            <TabsContent value="documents"><ClientDocuments userId={user.id} /></TabsContent>
          </Tabs>

          {/* Quick links */}
          <Card className="mt-8">
            <CardHeader><CardTitle className="text-base">Accesos rápidos</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" asChild><Link to="/mis-solicitudes">Ver todas mis solicitudes</Link></Button>
              <Button variant="secondary" size="sm" asChild><Link to="/maquinaria">Ver maquinaria</Link></Button>
              <Button variant="secondary" size="sm" asChild><Link to="/vehiculos">Ver vehículos</Link></Button>
              <Button variant="secondary" size="sm" asChild><Link to="/referidos">Programa de referidos</Link></Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

const SummaryCard = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number | string; highlight?: boolean }) => (
  <Card className={highlight ? "border-primary/50" : ""}>
    <CardContent className="pt-4 pb-3">
      <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${highlight ? "text-primary" : "text-muted-foreground"}`}>
        {icon}<span>{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </CardContent>
  </Card>
);

export default MyAccountPage;
