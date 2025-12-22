import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Mail, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      .select("id, name, email, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      const formattedNotifications = data.map((msg) => ({
        ...msg,
        isQuote: msg.message?.toLowerCase().includes("[cotización") || msg.message?.toLowerCase().includes("[cotizacion"),
      }));
      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter((n) => n.status === "pending").length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("notification-center")
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
      .update({ status: "responded" })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "responded" } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const pendingIds = notifications.filter((n) => n.status === "pending").map((n) => n.id);
    
    if (pendingIds.length === 0) return;

    const { error } = await supabase
      .from("contact_messages")
      .update({ status: "responded" })
      .in("id", pendingIds);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "responded" }))
      );
      setUnreadCount(0);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 md:w-96 bg-card border border-border shadow-xl z-50"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-semibold">Notificaciones</span>
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
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px] md:h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Mail className="h-10 w-10 opacity-30 mb-2" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "px-3 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                  notification.status === "pending" && "bg-primary/5"
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
                      {notification.status === "pending" && (
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
                      {notification.isQuote ? "Solicitud de cotización" : notification.message?.substring(0, 60)}
                      {notification.message && notification.message.length > 60 ? "..." : ""}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
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
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm"
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;
