import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Truck, MapPin, ArrowUp, ArrowDown, ExternalLink, Route as RouteIcon, Save } from "lucide-react";

interface WO {
  id: string;
  title: string;
  site_address: string | null;
  site_lat: number | null;
  site_lng: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: string;
  priority: string | null;
  assigned_vehicle_id: string | null;
  route_order: number | null;
  route_eta_minutes: number | null;
}
interface Vehicle { id: string; license_plate: string; brand: string | null; model: string | null; }

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-destructive/15 text-destructive",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

// Haversine (km)
const dist = (a: WO, b: WO) => {
  if (!a.site_lat || !a.site_lng || !b.site_lat || !b.site_lng) return 0;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.site_lat - a.site_lat);
  const dLng = toRad(b.site_lng - a.site_lng);
  const la1 = toRad(a.site_lat), la2 = toRad(b.site_lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const AdminDispatch = () => {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [wos, setWos] = useState<WO[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [{ data: wo }, { data: veh }] = await Promise.all([
      (supabase as any).rpc("get_dispatch_board", {
        _from: `${dateFrom}T00:00:00Z`,
        _to: `${dateTo}T23:59:59Z`,
      }),
      supabase.from("vehicles").select("id,license_plate,brand,model").order("license_plate"),
    ]);
    setWos((wo as WO[]) || []);
    setVehicles(veh || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const unassigned = useMemo(() => wos.filter((w) => !w.assigned_vehicle_id), [wos]);
  const byVehicle = useMemo(() => {
    const map = new Map<string, WO[]>();
    for (const w of wos) {
      if (!w.assigned_vehicle_id) continue;
      const arr = map.get(w.assigned_vehicle_id) || [];
      arr.push(w);
      map.set(w.assigned_vehicle_id, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.route_order ?? 999) - (b.route_order ?? 999));
    }
    return map;
  }, [wos]);

  const routeStats = (route: WO[]) => {
    let km = 0;
    for (let i = 1; i < route.length; i++) km += dist(route[i - 1], route[i]);
    return { km: km.toFixed(1), stops: route.length };
  };

  const assign = async (woId: string, vehicleId: string | null) => {
    setSaving(woId);
    if (!vehicleId) {
      await (supabase as any).from("work_orders").update({
        assigned_vehicle_id: null, route_order: null,
      }).eq("id", woId);
    } else {
      const existing = byVehicle.get(vehicleId) || [];
      const nextOrder = (existing[existing.length - 1]?.route_order ?? 0) + 1;
      await (supabase as any).from("work_orders").update({
        assigned_vehicle_id: vehicleId, route_order: nextOrder,
      }).eq("id", woId);
    }
    setSaving(null);
    await load();
  };

  const move = async (vehicleId: string, idx: number, dir: -1 | 1) => {
    const route = [...(byVehicle.get(vehicleId) || [])];
    const j = idx + dir;
    if (j < 0 || j >= route.length) return;
    [route[idx], route[j]] = [route[j], route[idx]];
    const ids = route.map((r) => r.id);
    await (supabase as any).rpc("assign_dispatch_route", {
      _vehicle_id: vehicleId, _work_order_ids: ids,
    });
    await load();
  };

  const optimize = async (vehicleId: string) => {
    // Nearest-neighbor optimization from first stop
    const route = [...(byVehicle.get(vehicleId) || [])].filter((r) => r.site_lat && r.site_lng);
    if (route.length < 3) {
      toast({ title: "Se necesitan al menos 3 paradas con coordenadas" });
      return;
    }
    const ordered: WO[] = [route[0]];
    const remaining = route.slice(1);
    while (remaining.length) {
      const last = ordered[ordered.length - 1];
      let bestIdx = 0, bestDist = Infinity;
      remaining.forEach((r, i) => {
        const d = dist(last, r);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      });
      ordered.push(remaining.splice(bestIdx, 1)[0]);
    }
    await (supabase as any).rpc("assign_dispatch_route", {
      _vehicle_id: vehicleId, _work_order_ids: ordered.map((o) => o.id),
    });
    toast({ title: "Ruta optimizada", description: "Orden recalculado por proximidad geográfica" });
    await load();
  };

  const gmapsLink = (w: WO) => w.site_lat && w.site_lng
    ? `https://www.google.com/maps/search/?api=1&query=${w.site_lat},${w.site_lng}`
    : w.site_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w.site_address)}` : null;

  const routeMapsLink = (route: WO[]) => {
    const pts = route.filter((r) => r.site_lat && r.site_lng);
    if (pts.length < 2) return null;
    const origin = `${pts[0].site_lat},${pts[0].site_lng}`;
    const dest = `${pts[pts.length - 1].site_lat},${pts[pts.length - 1].site_lng}`;
    const waypoints = pts.slice(1, -1).map((p) => `${p.site_lat},${p.site_lng}`).join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Desde</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {wos.length} OT · {unassigned.length} sin asignar · {byVehicle.size} vehículos con ruta
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Sin asignar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Sin asignar ({unassigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
            {unassigned.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Todas las OT están asignadas 🎉</p>
            )}
            {unassigned.map((w) => (
              <div key={w.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{w.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{w.site_address || "Sin dirección"}</p>
                  </div>
                  {w.priority && <Badge variant="secondary" className={PRIORITY_COLOR[w.priority] || ""}>{w.priority}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Select onValueChange={(v) => assign(w.id, v)} disabled={saving === w.id}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Asignar vehículo…" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.license_plate} {v.brand && `· ${v.brand}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {gmapsLink(w) && (
                    <a href={gmapsLink(w)!} target="_blank" rel="noreferrer"
                       className="text-xs text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Rutas por vehículo */}
        <div className="space-y-4">
          {byVehicle.size === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aún no hay rutas asignadas. Selecciona un vehículo en las OT sin asignar.
            </CardContent></Card>
          )}
          {Array.from(byVehicle.entries()).map(([vehId, route]) => {
            const veh = vehicles.find((v) => v.id === vehId);
            const stats = routeStats(route);
            const mapUrl = routeMapsLink(route);
            return (
              <Card key={vehId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {veh ? `${veh.license_plate} · ${veh.brand || ""} ${veh.model || ""}` : "Vehículo"}
                      <Badge variant="secondary">{stats.stops} paradas · {stats.km} km</Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => optimize(vehId)} className="gap-1">
                        <RouteIcon className="h-3.5 w-3.5" /> Optimizar
                      </Button>
                      {mapUrl && (
                        <a href={mapUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="gap-1">
                            <ExternalLink className="h-3.5 w-3.5" /> Ver ruta
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {route.map((w, idx) => (
                    <div key={w.id} className="flex items-center gap-2 rounded-md border p-2">
                      <div className="flex flex-col">
                        <Button size="icon" variant="ghost" className="h-6 w-6"
                                onClick={() => move(vehId, idx, -1)} disabled={idx === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6"
                                onClick={() => move(vehId, idx, 1)} disabled={idx === route.length - 1}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{w.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {w.site_address || "Sin dirección"}
                          {idx > 0 && ` · ${dist(route[idx - 1], w).toFixed(1)} km`}
                        </p>
                      </div>
                      {w.priority && (
                        <Badge variant="secondary" className={PRIORITY_COLOR[w.priority] || ""}>
                          {w.priority}
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => assign(w.id, null)}
                              title="Quitar de la ruta">×</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDispatch;
