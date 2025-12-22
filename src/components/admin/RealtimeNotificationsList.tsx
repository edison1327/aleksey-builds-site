import { useState, useEffect } from "react";
import { Bell, Mail, FileText, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  is_read: boolean;
  created_at: string;
  isQuote: boolean;
}

interface RealtimeNotificationsListProps {
  onNavigateToMessages?: () => void;
}

export const RealtimeNotificationsList = ({ onNavigateToMessages }: RealtimeNotificationsListProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, message, status, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    if (!error && data) {
      const formattedNotifications = data.map((msg) => ({
        ...msg,
        is_read: msg.is_read ?? false,
        isQuote: msg.message?.toLowerCase().includes("[cotización") || msg.message?.toLowerCase().includes("[cotizacion"),
      }));
      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter((n) => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("realtime-notifications-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_messages",
        },
        (payload) => {
          console.log("Realtime notification update:", payload);
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  return (
    <Card className="border-none shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent p-4 md:p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Bell className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            </div>
            Notificaciones en Tiempo Real
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Connection indicator */}
            <div className="flex items-center gap-1.5">
              <span 
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                )} 
              />
              <span className="text-xs text-muted-foreground hidden md:inline">
                {isConnected ? "En vivo" : "Conectando..."}
              </span>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 opacity-30 mb-3" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (onNavigateToMessages) {
                      onNavigateToMessages();
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        notification.isQuote
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-blue-500/10 text-blue-600"
                      )}
                    >
                      {notification.isQuote ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {notification.name}
                        </p>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.isQuote ? "Solicitud de cotización" : notification.message?.substring(0, 80)}
                        {notification.message && notification.message.length > 80 ? "..." : ""}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {!notification.is_read && (
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">
                              Nueva
                            </span>
                          )}
                          {notification.status === "pending" ? (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              Pendiente
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Respondido
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>
        <div className="p-3 border-t border-border/50">
          <Button
            variant="outline"
            className="w-full"
            onClick={onNavigateToMessages}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver todos los mensajes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeNotificationsList;
