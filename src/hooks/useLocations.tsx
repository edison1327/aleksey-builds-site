import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Location {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  lat: number | null;
  lng: number | null;
  is_active: boolean;
  is_primary: boolean;
  sort_order: number;
}

export function useLocations(onlyActive = true) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("locations").select("*").order("sort_order").order("name");
    if (onlyActive) q = q.eq("is_active", true);
    const { data } = await q;
    setLocations((data as Location[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("locations-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyActive]);

  return { locations, loading, reload: load };
}
