import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Mail, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

interface NotificationCenterProps {
  onNavigateToMessages?: () => void;
}

export const NotificationCenter = ({ onNavigateToMessages }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, message, status, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

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
      .channel(`notification-center-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_messages",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[350px] md:h-[450px] -mx-6 px-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 opacity-30 mb-3" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer",
                    !notification.is_read && "bg-primary/5 border-primary/20"
                  )}
                  onClick={() => {
                    if (onNavigateToMessages) {
                      onNavigateToMessages();
                      setIsOpen(false);
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
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (onNavigateToMessages) {
                onNavigateToMessages();
                setIsOpen(false);
              }
            }}
          >
            Ver todos los mensajes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCenter;
