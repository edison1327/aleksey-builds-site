import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Mail, Eye, Calculator, MessageSquare, Check, Clock, Search, Phone, Calendar, Bell, BellRing, Cog, Truck, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "quotes" | "contact">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "read" | "responded">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('contact-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          
          // Add to messages list
          setMessages((prev) => [newMessage, ...prev]);
          
          // Show notification
          setNewMessageAlert(true);
          
          const isQuote = newMessage.message.includes("[COTIZACIÓN DE ALQUILER]");
          
          toast({
            title: isQuote ? "🧾 Nueva Cotización" : "📧 Nuevo Mensaje",
            description: `${newMessage.name} - ${isQuote ? "Solicitud de cotización" : newMessage.message.substring(0, 50)}...`,
            duration: 10000,
          });

          // Play notification sound
          try {
            const audio = new Audio("data:audio/wav;base64,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");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (e) {
            // Audio not supported
          }

          // Clear alert after 3 seconds
          setTimeout(() => setNewMessageAlert(false), 3000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = payload.new as Message;
          setMessages((prev) => 
            prev.map((msg) => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          console.log('Message deleted:', payload);
          const deletedId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const isQuoteRequest = (message: Message) => {
    const lowerMessage = message.message.toLowerCase();
    return (
      message.message.includes("[COTIZACIÓN DE ALQUILER]") ||
      lowerMessage.includes("[cotización de maquinaria") ||
      lowerMessage.includes("[cotizacion de maquinaria") ||
      lowerMessage.includes("[cotización de vehículo") ||
      lowerMessage.includes("[cotizacion de vehiculo") ||
      lowerMessage.includes("[cotización de servicio") ||
      lowerMessage.includes("[cotizacion de servicio")
    );
  };

  const getQuoteType = (message: Message): "machinery" | "vehicle" | "service" | "general" | null => {
    if (!isQuoteRequest(message)) return null;
    const lowerMessage = message.message.toLowerCase();
    
    if (lowerMessage.includes("[cotización de maquinaria") || lowerMessage.includes("[cotizacion de maquinaria")) {
      return "machinery";
    }
    if (lowerMessage.includes("[cotización de vehículo") || lowerMessage.includes("[cotizacion de vehiculo")) {
      return "vehicle";
    }
    if (lowerMessage.includes("[cotización de servicio") || lowerMessage.includes("[cotizacion de servicio")) {
      return "service";
    }
    return "general";
  };

  const parseQuoteDetails = (message: Message) => {
    if (!isQuoteRequest(message)) return null;
    
    const lines = message.message.split("\n");
    const details: Record<string, string> = {};
    
    lines.forEach((line) => {
      if (line.startsWith("Tipo:")) details.tipo = line.replace("Tipo:", "").trim();
      if (line.startsWith("Equipo:")) details.equipo = line.replace("Equipo:", "").trim();
      if (line.startsWith("- Fecha inicio:")) details.fechaInicio = line.replace("- Fecha inicio:", "").trim();
      if (line.startsWith("- Fecha fin:")) details.fechaFin = line.replace("- Fecha fin:", "").trim();
      if (line.startsWith("- Duración:")) details.duracion = line.replace("- Duración:", "").trim();
      if (line.startsWith("- Empresa:")) details.empresa = line.replace("- Empresa:", "").trim();
      if (line.startsWith("- Ubicación del proyecto:")) details.ubicacion = line.replace("- Ubicación del proyecto:", "").trim();
    });
    
    return details;
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Actualizado", description: `Estado cambiado a ${newStatus}` });
      fetchMessages();
    } catch (error) {
      console.error("Error updating message:", error);
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este mensaje?")) return;

    try {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "Mensaje eliminado correctamente." });
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const filteredMessages = messages.filter((msg) => {
    // Filter by type
    if (activeTab === "quotes" && !isQuoteRequest(msg)) return false;
    if (activeTab === "contact" && isQuoteRequest(msg)) return false;
    
    // Filter by status
    if (statusFilter !== "all" && msg.status !== statusFilter) return false;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        msg.name.toLowerCase().includes(term) ||
        msg.email.toLowerCase().includes(term) ||
        msg.message.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="default" className="bg-amber-500"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "read":
        return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Leído</Badge>;
      case "responded":
        return <Badge variant="default" className="bg-green-600"><Check className="h-3 w-3 mr-1" />Respondido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = messages.filter((m) => m.status === "pending").length;
  const quotesCount = messages.filter((m) => isQuoteRequest(m)).length;
  const machineryQuotesCount = messages.filter((m) => getQuoteType(m) === "machinery").length;
  const vehicleQuotesCount = messages.filter((m) => getQuoteType(m) === "vehicle").length;
  const serviceQuotesCount = messages.filter((m) => getQuoteType(m) === "service").length;
  const contactCount = messages.filter((m) => !isQuoteRequest(m)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Mensajes y Cotizaciones</h2>
          <p className="text-muted-foreground">Gestiona los mensajes de contacto y solicitudes de cotización</p>
        </div>
        {newMessageAlert && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full animate-pulse">
            <BellRing className="h-5 w-5 text-primary animate-bounce" />
            <span className="text-sm font-medium text-primary">¡Nuevo mensaje!</span>
          </div>
        )}
        {!newMessageAlert && pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full">
            <Bell className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cotizaciones Card with breakdown */}
        <Card className="bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{quotesCount}</p>
                <p className="text-xs text-muted-foreground">Cotizaciones</p>
              </div>
            </div>
            {/* Quote breakdown */}
            <div className="flex gap-3 mt-3 text-xs text-muted-foreground border-t pt-2">
              <span className="flex items-center gap-1">
                <Cog className="h-3 w-3 text-orange-500" />
                {machineryQuotesCount}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3 text-purple-500" />
                {vehicleQuotesCount}
              </span>
              {serviceQuotesCount > 0 && (
                <span className="flex items-center gap-1">
                  <Calculator className="h-3 w-3 text-blue-500" />
                  {serviceQuotesCount}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contactCount}</p>
                <p className="text-xs text-muted-foreground">Contactos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">
              Todos ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex-1 sm:flex-none">
              <Calculator className="h-4 w-4 mr-1" />
              Cotizaciones ({quotesCount})
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex-1 sm:flex-none">
              <MessageSquare className="h-4 w-4 mr-1" />
              Contacto ({contactCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="read">Leídos</SelectItem>
              <SelectItem value="responded">Respondidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay mensajes que coincidan con los filtros</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => {
            const isQuote = isQuoteRequest(message);
            const quoteDetails = parseQuoteDetails(message);
            
            return (
              <Card 
                key={message.id} 
                className={`transition-all ${
                  message.status === "pending" 
                    ? "border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10" 
                    : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isQuote 
                          ? "bg-blue-100 dark:bg-blue-900/30" 
                          : "bg-purple-100 dark:bg-purple-900/30"
                      }`}>
                        {isQuote 
                          ? <Calculator className="h-5 w-5 text-blue-600" /> 
                          : <MessageSquare className="h-5 w-5 text-purple-600" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{message.name}</CardTitle>
                          {getStatusBadge(message.status)}
                          {isQuote && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              Cotización
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {message.email}
                          </span>
                          {message.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {message.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMessage(message);
                          if (message.status === "pending") {
                            handleUpdateStatus(message.id, "read");
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(message.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isQuote && quoteDetails ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Equipo</p>
                        <p className="font-medium truncate">{quoteDetails.equipo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo</p>
                        <p className="font-medium">{quoteDetails.tipo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duración</p>
                        <p className="font-medium">{quoteDetails.duracion}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Empresa</p>
                        <p className="font-medium truncate">{quoteDetails.empresa || "N/A"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm line-clamp-2">{message.message}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(message.created_at), "PPp", { locale: es })}
                    </p>
                    <div className="flex gap-1">
                      {message.status !== "responded" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(message.id, "responded")}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Marcar respondido
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && isQuoteRequest(selectedMessage) ? (
                <>
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Solicitud de Cotización
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Mensaje de Contacto
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6 py-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nombre</label>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                  <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline block">
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Teléfono</label>
                    <a href={`tel:${selectedMessage.phone}`} className="text-primary hover:underline block">
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Quote Details */}
              {isQuoteRequest(selectedMessage) && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    Detalles de la Cotización
                  </label>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    {(() => {
                      const details = parseQuoteDetails(selectedMessage);
                      return details ? (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Tipo de equipo</p>
                            <p className="font-medium">{details.tipo}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Equipo</p>
                            <p className="font-medium">{details.equipo}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha inicio</p>
                            <p className="font-medium">{details.fechaInicio}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha fin</p>
                            <p className="font-medium">{details.fechaFin}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duración</p>
                            <p className="font-medium">{details.duracion}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Empresa</p>
                            <p className="font-medium">{details.empresa || "N/A"}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Ubicación del proyecto</p>
                            <p className="font-medium">{details.ubicacion || "N/A"}</p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {/* Full Message */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Mensaje Completo
                </label>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Fecha</label>
                    <p className="text-sm">{format(new Date(selectedMessage.created_at), "PPpp", { locale: es })}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Estado</label>
                    <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {selectedMessage.status !== "responded" && (
                    <Button 
                      variant="default"
                      onClick={() => {
                        handleUpdateStatus(selectedMessage.id, "responded");
                        setSelectedMessage({ ...selectedMessage, status: "responded" });
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como respondido
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    asChild
                  >
                    <a href={`mailto:${selectedMessage.email}?subject=Re: ${isQuoteRequest(selectedMessage) ? "Solicitud de Cotización" : "Mensaje de Contacto"} - Aleksey`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Responder
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMessages;
