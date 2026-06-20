import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminBadgeCounts {
  messages: number;
  quotes: number;
  applications: number;
  bookings: number;
}

const QUOTE_MARKERS = [
  "[cotización de maquinaria",
  "[cotizacion de maquinaria",
  "[cotización de vehículo",
  "[cotizacion de vehiculo",
  "[cotización de servicio",
  "[cotizacion de servicio",
];

const isQuoteMessage = (text: string | null) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return QUOTE_MARKERS.some((mk) => lower.includes(mk));
};

const EMPTY: AdminBadgeCounts = { messages: 0, quotes: 0, applications: 0, bookings: 0 };

/**
 * Fetches pending-item counts for the admin sidebar (unread messages, unread quotes,
 * pending job applications, pending equipment bookings). Subscribes to realtime
 * changes on the relevant tables so badges stay in sync.
 */
export function useAdminBadges() {
  const [counts, setCounts] = useState<AdminBadgeCounts>(EMPTY);

  const refresh = useCallback(async () => {
    try {
      const [msgsRes, appsRes, bookingsRes] = await Promise.all([
        supabase
          .from("contact_messages")
          .select("id, message")
          .eq("is_read", false),
        supabase
          .from("job_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("equipment_bookings")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending", "reserved"]),
      ]);

      const unread = msgsRes.data || [];
      const quotes = unread.filter((m: any) => isQuoteMessage(m.message)).length;
      const messages = unread.length - quotes;

      setCounts({
        messages,
        quotes,
        applications: appsRes.count ?? 0,
        bookings: bookingsRes.count ?? 0,
      });
    } catch (err) {
      console.error("useAdminBadges refresh error", err);
    }
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel(`admin-badges-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_applications" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipment_bookings" },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { counts, refresh };
}
