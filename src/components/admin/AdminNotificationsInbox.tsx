import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Inbox, Mail, Calendar, Briefcase, MessageSquare, AlarmClock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
  metadata: any;
}

const typeMeta: Record<string, { label: string; icon: any; color: string }> = {
  contact_message: { label: "Mensaje", icon: Mail, color: "bg-blue-500/10 text-blue-600" },
  customer_reply: { label: "Respuesta cliente", icon: MessageSquare, color: "bg-indigo-500/10 text-indigo-600" },
  booking: { label: "Reserva", icon: Calendar, color: "bg-amber-500/10 text-amber-600" },
  application: { label: "Postulación", icon: Briefcase, color: "bg-emerald-500/10 text-emerald-600" },
  testimonial: { label: "Reseña", icon: MessageSquare, color: "bg-pink-500/10 text-pink-600" },
  reminder: { label: "Recordatorio", icon: AlarmClock, color: "bg-orange-500/10 text-orange-600" },
};

const AdminNotificationsInbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Error cargando notificaciones");
    else setItems((data as NotificationRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const channel = supabase
      .channel(`inbox-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const markRead = async (id: string, read: boolean) => {
    await supabase.from("notifications").update({ read }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("Todas marcadas como leídas");
  };

  const removeOne = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const clearRead = async () => {
    if (!user) return;
    if (!confirm("¿Eliminar todas las notificaciones leídas?")) return;
    await supabase.from("notifications").delete().eq("user_id", user.id).eq("read", true);
    setItems((prev) => prev.filter((n) => !n.read));
    toast.success("Notificaciones leídas eliminadas");
  };

  const types = Array.from(new Set(items.map((i) => i.type)));
  const filtered = items.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });
  const unreadCount = items.filter((n) => !n.read).length;

  const openLink = (n: NotificationRow) => {
    markRead(n.id, true);
    if (!n.link) return;
    if (n.link.startsWith("/admin")) {
      const hash = n.link.split("#")[1];
      navigate("/admin");
      if (hash) window.location.hash = hash;
    } else {
      navigate(n.link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" /> Bandeja de notificaciones
          </h2>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"} · {items.length} en total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4 mr-2" /> Marcar todas leídas
          </Button>
          <Button variant="outline" size="sm" onClick={clearRead}>
            <Trash2 className="h-4 w-4 mr-2" /> Limpiar leídas
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">Todas ({items.length})</TabsTrigger>
          <TabsTrigger value="unread">No leídas ({unreadCount})</TabsTrigger>
          {types.map((t) => (
            <TabsTrigger key={t} value={t}>
              {typeMeta[t]?.label ?? t} ({items.filter((n) => n.type === t).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[65vh]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Inbox className="h-10 w-10 opacity-40" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((n) => {
                  const meta = typeMeta[n.type] ?? { label: n.type, icon: Bell, color: "bg-muted text-muted-foreground" };
                  const Icon = meta.icon;
                  return (
                    <li key={n.id} className={cn("p-4 flex items-start gap-3 hover:bg-muted/40 transition-colors", !n.read && "bg-primary/5")}>
                      <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", meta.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn("font-medium truncate", !n.read && "font-semibold")}>{n.title}</p>
                          <Badge variant="outline" className="text-xs">{meta.label}</Badge>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary" aria-label="No leída" />}
                        </div>
                        {n.message && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {n.link && (
                          <Button variant="ghost" size="icon" onClick={() => openLink(n)} title="Abrir">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => markRead(n.id, !n.read)} title={n.read ? "Marcar no leída" : "Marcar leída"}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeOne(n.id)} title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationsInbox;
