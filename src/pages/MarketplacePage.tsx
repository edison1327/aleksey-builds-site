import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar, CheckCircle2, XCircle, Star, Truck, Wrench } from "lucide-react";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import OptimizedImage from "@/components/OptimizedImage";

interface Listing {
  id: string;
  equipment_type: "machinery" | "vehicle";
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  image_url: string | null;
  price: string | null;
  daily_rate: number | null;
  min_rental_days: number;
  deposit_amount: number | null;
  rental_terms: string | null;
  is_featured: boolean;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDaysISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const MarketplacePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "machinery" | "vehicle">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(plusDaysISO(3));
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean | undefined>>({});
  const [checkingAll, setCheckingAll] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("marketplace_listings" as any)
        .select("*")
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true });
      if (error) console.error(error);
      setListings((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    listings.forEach((l) => l.category && s.add(l.category));
    return Array.from(s).sort();
  }, [listings]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (typeFilter !== "all" && l.equipment_type !== typeFilter) return false;
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      if (search) {
        const t = search.toLowerCase();
        const hay = `${l.name} ${l.brand || ""} ${l.model || ""} ${l.category || ""}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [listings, typeFilter, categoryFilter, search]);

  const days = useMemo(() => {
    const a = new Date(startDate).getTime();
    const b = new Date(endDate).getTime();
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }, [startDate, endDate]);

  const checkAvailability = async () => {
    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
      toast({ title: "Fechas inválidas", variant: "destructive" });
      return;
    }
    setCheckingAll(true);
    const results: Record<string, boolean | undefined> = {};
    await Promise.all(
      filtered.map(async (l) => {
        const { data } = await supabase.rpc("check_equipment_availability" as any, {
          _equipment_type: l.equipment_type,
          _equipment_id: l.id,
          _start_date: startDate,
          _end_date: endDate,
        });
        results[`${l.equipment_type}:${l.id}`] = data as boolean;
      }),
    );
    setAvailabilityMap((prev) => ({ ...prev, ...results }));
    setCheckingAll(false);
    toast({ title: "Disponibilidad actualizada" });
  };

  const reserve = (l: Listing) => {
    const params = new URLSearchParams({
      type: l.equipment_type,
      id: l.id,
      name: l.name,
      start: startDate,
      end: endDate,
    });
    navigate(`/cotizar?${params.toString()}`);
  };

  return (
    <>
      <SEO
        title="Marketplace de Equipos B2B — Alquiler de maquinaria y vehículos"
        description="Explora nuestro catálogo B2B: maquinaria pesada y vehículos disponibles para alquiler. Consulta disponibilidad en tiempo real y reserva online."
      />
      <main className="min-h-dvh pt-24">
        <section className="container mx-auto px-4 py-8">
          <header className="max-w-3xl mb-8">
            <Badge variant="secondary" className="mb-3">B2B Marketplace</Badge>
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-3">
              Marketplace de equipos
            </h1>
            <p className="text-muted-foreground text-lg">
              Reserva maquinaria y vehículos verificados directamente en línea. Consulta disponibilidad para tus fechas y solicita cotización en un clic.
            </p>
          </header>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4 grid gap-3 md:grid-cols-6">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nombre, marca…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="machinery">Maquinaria</SelectItem>
                  <SelectItem value="vehicle">Vehículos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground">Desde</label>
                <Input type="date" value={startDate} min={todayISO()} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hasta</label>
                <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="md:col-span-6 flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  {filtered.length} resultado(s) · Rango: <b>{days}</b> día(s)
                </p>
                <Button onClick={checkAvailability} disabled={checkingAll} size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {checkingAll ? "Verificando…" : "Verificar disponibilidad"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              No hay equipos publicados en el marketplace todavía.
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((l) => {
                const key = `${l.equipment_type}:${l.id}`;
                const avail = availabilityMap[key];
                const totalEst = l.daily_rate ? l.daily_rate * days : null;
                return (
                  <Card key={key} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                    <div className="relative aspect-video bg-muted">
                      {l.image_url ? (
                        <OptimizedImage src={l.image_url} alt={l.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {l.equipment_type === "vehicle" ? <Truck className="h-12 w-12" /> : <Wrench className="h-12 w-12" />}
                        </div>
                      )}
                      {l.is_featured && (
                        <Badge className="absolute top-2 left-2 gap-1">
                          <Star className="h-3 w-3" /> Destacado
                        </Badge>
                      )}
                      {avail !== undefined && (
                        <Badge variant={avail ? "default" : "destructive"} className="absolute top-2 right-2 gap-1">
                          {avail ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {avail ? "Disponible" : "Ocupado"}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-heading font-semibold">{l.name}</h3>
                        <Badge variant="outline" className="capitalize shrink-0">
                          {l.equipment_type === "vehicle" ? "Vehículo" : "Maquinaria"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {[l.brand, l.model, l.category].filter(Boolean).join(" · ")}
                      </p>
                      {l.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{l.description}</p>
                      )}
                      <div className="mt-auto space-y-2">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-lg font-bold text-primary">
                              {l.daily_rate ? `S/ ${l.daily_rate.toFixed(2)}` : l.price || "Consultar"}
                            </span>
                            {l.daily_rate && <span className="text-xs text-muted-foreground"> /día</span>}
                          </div>
                          {totalEst && (
                            <span className="text-xs text-muted-foreground">
                              ≈ S/ {totalEst.toFixed(2)} ({days}d)
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                          {l.min_rental_days > 1 && <span>Mín. {l.min_rental_days} días</span>}
                          {l.deposit_amount && <span>· Depósito S/ {Number(l.deposit_amount).toFixed(2)}</span>}
                        </div>
                        <Button className="w-full" onClick={() => reserve(l)} disabled={avail === false}>
                          {avail === false ? "No disponible" : "Reservar / Cotizar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
        <Footer />
      </main>
    </>
  );
};

export default MarketplacePage;
