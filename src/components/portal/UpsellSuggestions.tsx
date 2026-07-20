import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";

interface Item {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  kind: "machinery" | "vehicle";
}

interface Props {
  email: string;
  customerName: string;
}

const UpsellSuggestions = ({ email, customerName }: Props) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: bookings } = await supabase
        .from("equipment_bookings")
        .select("equipment_type, equipment_id")
        .eq("customer_email", email);
      const usedIds = new Set(((bookings as any[]) ?? []).map((b) => b.equipment_id).filter(Boolean));

      const [{ data: m }, { data: v }] = await Promise.all([
        supabase.from("machinery").select("id, name, category, image_url").eq("is_active", true).limit(8),
        supabase.from("vehicles").select("id, name, category, image_url").eq("is_active", true).limit(8),
      ]);
      const all: Item[] = [
        ...((m as any[]) ?? []).map((x) => ({ ...x, kind: "machinery" as const })),
        ...((v as any[]) ?? []).map((x) => ({ ...x, kind: "vehicle" as const })),
      ].filter((x) => !usedIds.has(x.id));
      setItems(all.sort(() => Math.random() - 0.5).slice(0, 4));
      setLoading(false);
    })();
  }, [email]);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (items.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Te podría interesar</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((it) => (
            <div key={`${it.kind}-${it.id}`} className="border rounded-lg overflow-hidden bg-card">
              {it.image_url && (
                <img src={it.image_url} alt={it.name} loading="lazy" className="w-full h-32 object-cover" />
              )}
              <div className="p-3 space-y-1">
                <div className="text-sm font-medium line-clamp-1">{it.name}</div>
                {it.category && <div className="text-xs text-muted-foreground line-clamp-1">{it.category}</div>}
                <Button size="sm" variant="secondary" className="w-full mt-2" asChild>
                  <Link to={`/cotizar?nombre=${encodeURIComponent(customerName)}&email=${encodeURIComponent(email)}&equipo=${encodeURIComponent(it.name)}`}>
                    Cotizar <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpsellSuggestions;
