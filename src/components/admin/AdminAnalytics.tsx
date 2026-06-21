import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Download, TrendingUp, TrendingDown, Clock, Target, Activity, MessageSquare } from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";
import LoadingSpinner from "@/components/LoadingSpinner";

type WeekPoint = { week: string; messages: number; quotes: number; bookings: number; applications: number };
type FunnelStep = { step: string; value: number };

const WEEKS = 12;

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // Monday as start
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
};

const fmtWeek = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState<WeekPoint[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [byType, setByType] = useState<{ type: string; count: number; fill: string }[]>([]);
  const [avgResponseHours, setAvgResponseHours] = useState<number | null>(null);
  const [responseRate, setResponseRate] = useState<number>(0);
  const [quoteConversion, setQuoteConversion] = useState<number>(0);
  const [weekDelta, setWeekDelta] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const since = startOfWeek(new Date());
        since.setDate(since.getDate() - 7 * (WEEKS - 1));

        const [msgsRes, bookingsRes, appsRes, repliesRes] = await Promise.all([
          supabase
            .from("contact_messages")
            .select("id, status, message, created_at")
            .gte("created_at", since.toISOString()),
          supabase
            .from("equipment_bookings")
            .select("id, created_at")
            .gte("created_at", since.toISOString()),
          supabase
            .from("job_applications")
            .select("id, created_at")
            .gte("created_at", since.toISOString()),
          supabase
            .from("message_replies")
            .select("message_id, created_at")
            .gte("created_at", since.toISOString()),
        ]);

        const messages = msgsRes.data ?? [];
        const bookings = bookingsRes.data ?? [];
        const applications = appsRes.data ?? [];
        const replies = repliesRes.data ?? [];

        // Build week buckets
        const buckets: Record<string, WeekPoint> = {};
        const order: string[] = [];
        for (let i = 0; i < WEEKS; i++) {
          const d = new Date(since);
          d.setDate(d.getDate() + i * 7);
          const key = fmtWeek(d);
          order.push(key);
          buckets[key] = { week: key, messages: 0, quotes: 0, bookings: 0, applications: 0 };
        }
        const bucketKey = (iso: string) => fmtWeek(startOfWeek(new Date(iso)));

        let quotesTotal = 0;
        const typeCounts: Record<string, number> = { Maquinaria: 0, Vehículos: 0, Servicios: 0, Otros: 0 };
        for (const m of messages) {
          const k = bucketKey(m.created_at);
          if (!buckets[k]) continue;
          buckets[k].messages++;
          const txt = (m.message || "").toLowerCase();
          const isQuote = txt.includes("[cotización") || txt.includes("[cotizacion");
          if (isQuote) {
            buckets[k].quotes++;
            quotesTotal++;
            if (txt.includes("maquinaria")) typeCounts.Maquinaria++;
            else if (txt.includes("vehículo") || txt.includes("vehiculo")) typeCounts.Vehículos++;
            else if (txt.includes("servicio")) typeCounts.Servicios++;
            else typeCounts.Otros++;
          }
        }
        for (const b of bookings) {
          const k = bucketKey(b.created_at);
          if (buckets[k]) buckets[k].bookings++;
        }
        for (const a of applications) {
          const k = bucketKey(a.created_at);
          if (buckets[k]) buckets[k].applications++;
        }

        setWeekly(order.map((k) => buckets[k]));

        // Funnel: messages → quotes → bookings → applications
        setFunnel([
          { step: "Mensajes", value: messages.length },
          { step: "Cotizaciones", value: quotesTotal },
          { step: "Reservas", value: bookings.length },
          { step: "Postulaciones", value: applications.length },
        ]);

        const palette = ["hsl(25,95%,53%)", "hsl(187,85%,43%)", "hsl(250,80%,60%)", "hsl(0,0%,55%)"];
        setByType(
          Object.entries(typeCounts)
            .filter(([, v]) => v > 0)
            .map(([type, count], i) => ({ type, count, fill: palette[i % palette.length] }))
        );

        // Conversion: quotes / messages
        setQuoteConversion(messages.length ? (quotesTotal / messages.length) * 100 : 0);

        // Response rate
        const responded = messages.filter((m) => m.status === "responded").length;
        setResponseRate(messages.length ? (responded / messages.length) * 100 : 0);

        // Average response time using earliest reply per message
        const firstReplyByMsg: Record<string, string> = {};
        for (const r of replies) {
          if (!firstReplyByMsg[r.message_id] || r.created_at < firstReplyByMsg[r.message_id]) {
            firstReplyByMsg[r.message_id] = r.created_at;
          }
        }
        const deltas: number[] = [];
        for (const m of messages) {
          const replyAt = firstReplyByMsg[m.id];
          if (!replyAt) continue;
          const ms = new Date(replyAt).getTime() - new Date(m.created_at).getTime();
          if (ms > 0) deltas.push(ms / 36e5);
        }
        setAvgResponseHours(
          deltas.length ? Number((deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(1)) : null
        );

        // Week-over-week delta on messages
        const last = buckets[order[order.length - 1]]?.messages ?? 0;
        const prev = buckets[order[order.length - 2]]?.messages ?? 0;
        setWeekDelta(prev === 0 ? (last > 0 ? 100 : 0) : ((last - prev) / prev) * 100);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = useMemo(
    () => [
      {
        label: "Tasa de cotización",
        value: `${quoteConversion.toFixed(1)}%`,
        hint: "Cotizaciones / mensajes (12 sem.)",
        icon: Target,
        accent: "text-emerald-500",
      },
      {
        label: "Tasa de respuesta",
        value: `${responseRate.toFixed(0)}%`,
        hint: "Mensajes respondidos",
        icon: MessageSquare,
        accent: "text-blue-500",
      },
      {
        label: "Tiempo medio de respuesta",
        value: avgResponseHours == null ? "—" : `${avgResponseHours} h`,
        hint: "Primera respuesta tras recepción",
        icon: Clock,
        accent: "text-amber-500",
      },
      {
        label: "Variación semanal",
        value: `${weekDelta >= 0 ? "+" : ""}${weekDelta.toFixed(0)}%`,
        hint: "Mensajes vs. semana previa",
        icon: weekDelta >= 0 ? TrendingUp : TrendingDown,
        accent: weekDelta >= 0 ? "text-emerald-500" : "text-rose-500",
      },
    ],
    [quoteConversion, responseRate, avgResponseHours, weekDelta]
  );

  const downloadWeeklyCsv = () => {
    exportCsv(`analitica-semanal-${new Date().toISOString().slice(0, 10)}.csv`, weekly, [
      { key: "week", label: "Semana" },
      { key: "messages", label: "Mensajes" },
      { key: "quotes", label: "Cotizaciones" },
      { key: "bookings", label: "Reservas" },
      { key: "applications", label: "Postulaciones" },
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Analítica avanzada
          </h2>
          <p className="text-sm text-muted-foreground">
            Conversión, tiempos de respuesta y tendencias de las últimas {WEEKS} semanas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadWeeklyCsv} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-none shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs md:text-sm">{k.label}</CardDescription>
                <k.icon className={`h-4 w-4 ${k.accent}`} />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold">{k.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">{k.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly trend */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Tendencia semanal</CardTitle>
          <CardDescription>Mensajes, cotizaciones, reservas y postulaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              messages: { label: "Mensajes", color: "hsl(var(--primary))" },
              quotes: { label: "Cotizaciones", color: "hsl(25,95%,53%)" },
              bookings: { label: "Reservas", color: "hsl(187,85%,43%)" },
              applications: { label: "Postulaciones", color: "hsl(250,80%,60%)" },
            }}
            className="h-64 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="quotes" stroke="hsl(25,95%,53%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bookings" stroke="hsl(187,85%,43%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="applications" stroke="hsl(250,80%,60%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Funnel */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Embudo de conversión</CardTitle>
            <CardDescription>De contacto a acción concreta</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={funnel} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="step" type="category" tick={{ fontSize: 12 }} width={110} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quote types */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Cotizaciones por tipo</CardTitle>
            <CardDescription>Distribución de solicitudes (12 sem.)</CardDescription>
          </CardHeader>
          <CardContent>
            {byType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Aún no hay cotizaciones registradas.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={byType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {byType.map((entry) => (
                      <Cell key={entry.type} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
