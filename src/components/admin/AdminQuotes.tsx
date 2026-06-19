import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Eye,
  Check,
  Clock,
  Search,
  Phone,
  Mail,
  Calendar,
  Cog,
  Truck,
  FileText,
  Trash2,
  Building,
  MapPin,
  ClipboardList,
  Download,
  FileDown,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportCsv } from "@/lib/exportCsv";
import TemplatePicker from "@/components/admin/TemplatePicker";
import { downloadQuotePdf } from "@/lib/quotePdf";

interface QuoteMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

type QuoteType = "machinery" | "vehicle" | "service" | "general";

const QUOTE_MARKERS = [
  "[cotización de alquiler]",
  "[cotización de maquinaria",
  "[cotizacion de maquinaria",
  "[cotización de vehículo",
  "[cotizacion de vehiculo",
  "[cotización de servicio",
  "[cotizacion de servicio",
];

const isQuote = (m: QuoteMessage) => {
  const lower = m.message.toLowerCase();
  return QUOTE_MARKERS.some((mk) => lower.includes(mk));
};

const getQuoteType = (m: QuoteMessage): QuoteType => {
  const lower = m.message.toLowerCase();
  if (lower.includes("maquinaria")) return "machinery";
  if (lower.includes("vehículo") || lower.includes("vehiculo")) return "vehicle";
  if (lower.includes("servicio")) return "service";
  return "general";
};

const parseDetails = (m: QuoteMessage) => {
  const out: Record<string, string> = {};
  m.message.split("\n").forEach((raw) => {
    const line = raw.replace(/^[-•\s]+/, "").trim();
    const idx = line.indexOf(":");
    if (idx > 0 && idx < 50) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key && val) out[key] = val;
    }
  });
  return out;
};

const typeMeta: Record<QuoteType, { label: string; icon: typeof Cog; color: string }> = {
  machinery: { label: "Maquinaria", icon: Cog, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" },
  vehicle: { label: "Vehículo", icon: Truck, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
  service: { label: "Servicio", icon: ClipboardList, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  general: { label: "General", icon: FileText, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
};

const AdminQuotes = () => {
  const [quotes, setQuotes] = useState<QuoteMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<QuoteMessage | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | QuoteType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "read" | "responded">("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setQuotes((data || []).filter((m) => isQuote(m as QuoteMessage)) as QuoteMessage[]);
    } catch (err) {
      console.error("Error fetching quotes:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-quotes-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        () => {
          fetchQuotes();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQuotes]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
      if (error) throw error;
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
      if (selected?.id === id) setSelected({ ...selected, status });
      toast({ title: "Actualizado", description: `Estado: ${status}` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  const removeQuote = async (id: string) => {
    if (!confirm("¿Eliminar esta solicitud?")) return;
    try {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      if (selected?.id === id) setSelected(null);
      toast({ title: "Eliminada", description: "Solicitud eliminada." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (typeFilter !== "all" && getQuoteType(q) !== typeFilter) return false;
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      if (search) {
        const t = search.toLowerCase();
        if (
          !q.name.toLowerCase().includes(t) &&
          !q.email.toLowerCase().includes(t) &&
          !q.message.toLowerCase().includes(t)
        )
          return false;
      }
      return true;
    });
  }, [quotes, typeFilter, statusFilter, search]);

  const counts = useMemo(() => {
    return {
      total: quotes.length,
      pending: quotes.filter((q) => q.status === "pending").length,
      machinery: quotes.filter((q) => getQuoteType(q) === "machinery").length,
      vehicle: quotes.filter((q) => getQuoteType(q) === "vehicle").length,
      service: quotes.filter((q) => getQuoteType(q) === "service").length,
    };
  }, [quotes]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-500">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "read":
        return (
          <Badge variant="secondary">
            <Eye className="h-3 w-3 mr-1" />
            Leída
          </Badge>
        );
      case "responded":
        return (
          <Badge className="bg-green-600 hover:bg-green-600">
            <Check className="h-3 w-3 mr-1" />
            Respondida
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const details = selected ? parseDetails(selected) : {};
  const selectedType = selected ? getQuoteType(selected) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold">Panel de Solicitudes</h2>
        <p className="text-muted-foreground">
          Cotizaciones de maquinaria, vehículos y servicios recibidas desde el sitio.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{counts.total}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Cog className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Maquinaria</p>
              <p className="text-2xl font-bold">{counts.machinery}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Truck className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Vehículos</p>
              <p className="text-2xl font-bold">{counts.vehicle}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Servicios</p>
              <p className="text-2xl font-bold">{counts.service}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)} className="flex-1">
          <TabsList className="w-full sm:w-auto flex-wrap h-auto">
            <TabsTrigger value="all">Todas ({counts.total})</TabsTrigger>
            <TabsTrigger value="machinery">
              <Cog className="h-4 w-4 mr-1" /> Maquinaria ({counts.machinery})
            </TabsTrigger>
            <TabsTrigger value="vehicle">
              <Truck className="h-4 w-4 mr-1" /> Vehículos ({counts.vehicle})
            </TabsTrigger>
            <TabsTrigger value="service">
              <ClipboardList className="h-4 w-4 mr-1" /> Servicios ({counts.service})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nombre, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="read">Leídas</SelectItem>
              <SelectItem value="responded">Respondidas</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() =>
              exportCsv(
                `cotizaciones-${new Date().toISOString().slice(0, 10)}.csv`,
                filtered,
                [
                  { key: "created_at", label: "Fecha", format: (v) => format(new Date(v as string), "yyyy-MM-dd HH:mm") },
                  { key: "name", label: "Nombre" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Teléfono" },
                  { key: "status", label: "Estado" },
                  { key: "id", label: "Tipo", format: (_v, row) => typeMeta[getQuoteType(row)].label },
                  { key: "message", label: "Mensaje" },
                ],
              )
            }
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No hay solicitudes que coincidan con los filtros.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((q) => {
            const t = getQuoteType(q);
            const meta = typeMeta[t];
            const Icon = meta.icon;
            return (
              <Card
                key={q.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelected(q);
                  if (q.status === "pending") updateStatus(q.id, "read");
                }}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${meta.color} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{q.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {meta.label}
                        </Badge>
                        {statusBadge(q.status)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {q.email}
                        </span>
                        {q.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {q.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(q.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuote(q.id);
                      }}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && selectedType && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = typeMeta[selectedType].icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  Solicitud de {typeMeta[selectedType].label}
                </DialogTitle>
                <DialogDescription>
                  Recibida el{" "}
                  {format(new Date(selected.created_at), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <p className="font-semibold text-base">{selected.name}</p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selected.email}`} className="text-primary hover:underline">
                        {selected.email}
                      </a>
                    </p>
                    {selected.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${selected.phone}`} className="text-primary hover:underline">
                          {selected.phone}
                        </a>
                      </p>
                    )}
                  </CardContent>
                </Card>

                {Object.keys(details).length > 0 && (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                        Detalles
                      </p>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {Object.entries(details).map(([k, v]) => {
                          const lower = k.toLowerCase();
                          const Icn = lower.includes("ubicación") || lower.includes("ubicacion")
                            ? MapPin
                            : lower.includes("empresa")
                            ? Building
                            : lower.includes("fecha") || lower.includes("duración") || lower.includes("duracion")
                            ? Calendar
                            : null;
                          return (
                            <div key={k} className="flex items-start gap-2">
                              {Icn && <Icn className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                              <div className="min-w-0">
                                <dt className="text-xs text-muted-foreground">{k}</dt>
                                <dd className="font-medium break-words">{v}</dd>
                              </div>
                            </div>
                          );
                        })}
                      </dl>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Mensaje completo
                    </p>
                    <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 bg-muted/50 p-3 rounded-md max-h-64 overflow-auto">
                      {selected.message}
                    </pre>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    {statusBadge(selected.status)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.status !== "responded" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(selected.id, "responded")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Marcar respondida
                      </Button>
                    )}
                    {selected.status === "responded" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "pending")}>
                        <Clock className="h-4 w-4 mr-1" />
                        Reabrir
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${selected.email}?subject=Respuesta a su solicitud`}>
                        <Mail className="h-4 w-4 mr-1" />
                        Responder por email
                      </a>
                    </Button>
                    <TemplatePicker
                      email={selected.email}
                      vars={{ name: selected.name, ...details }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadQuotePdf(
                          {
                            quoteId: selected.id,
                            date: new Date(selected.created_at),
                            title: `Solicitud de ${typeMeta[selectedType!].label}`,
                            customer: {
                              name: selected.name,
                              email: selected.email,
                              phone: selected.phone || undefined,
                              company: details["Empresa"] || details["empresa"],
                              location:
                                details["Ubicación del proyecto"] ||
                                details["Ubicación"] ||
                                details["ubicacion"],
                            },
                            details: Object.entries(details).map(([label, value]) => ({
                              label,
                              value,
                            })),
                            message: selected.message,
                          },
                          `cotizacion-${selected.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
                        )
                      }
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    {selected.phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQuotes;
