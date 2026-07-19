import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2, ShieldOff, Zap } from "lucide-react";
import { format } from "date-fns";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit_per_min: number;
  last_used_at: string | null;
  usage_count: number;
  revoked_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const ALL_SCOPES = [
  { id: "read:invoices", label: "Leer facturas" },
  { id: "read:work_orders", label: "Leer órdenes de trabajo" },
  { id: "read:bookings", label: "Leer reservas" },
  { id: "write:bookings", label: "Crear reservas" },
];

const BASE_URL = `${(import.meta.env.VITE_SUPABASE_URL as string) || ""}/functions/v1/public-api`;

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScopes, setNewScopes] = useState<string[]>(["read:invoices", "read:work_orders", "read:bookings"]);
  const [newRate, setNewRate] = useState(60);
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<{ raw: string; prefix: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("api_keys")
      .select("id,name,key_prefix,scopes,rate_limit_per_min,last_used_at,usage_count,revoked_at,expires_at,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setKeys((data ?? []) as ApiKey[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!newName.trim()) {
      toast.error("Ingresa un nombre");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.rpc("create_api_key", {
      _name: newName.trim(),
      _scopes: newScopes,
      _rate_limit: newRate,
      _expires_at: null,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.raw_key) {
      setRevealed({ raw: row.raw_key, prefix: row.key_prefix });
      setDialogOpen(false);
      setNewName("");
      load();
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("¿Revocar esta llave? Los sistemas que la usen dejarán de funcionar.")) return;
    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Llave revocada");
      load();
    }
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copiado");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> API Keys
            </CardTitle>
            <CardDescription>
              Genera llaves para integrar tu sistema con nuestra API pública. Nunca compartas la llave completa.
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Zap className="mr-2 h-4 w-4" /> Nueva llave
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aún no has creado llaves de API.
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className={`rounded-lg border p-4 flex flex-col md:flex-row md:items-center gap-3 ${
                    k.revoked_at ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{k.name}</span>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {k.key_prefix}…
                      </code>
                      {k.revoked_at && <Badge variant="destructive">Revocada</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
                      <span>Creada: {format(new Date(k.created_at), "yyyy-MM-dd")}</span>
                      <span>Usos: {k.usage_count}</span>
                      <span>Rate: {k.rate_limit_per_min}/min</span>
                      {k.last_used_at && (
                        <span>Último uso: {format(new Date(k.last_used_at), "yyyy-MM-dd HH:mm")}</span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {k.scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {!k.revoked_at && (
                    <Button size="sm" variant="outline" onClick={() => revoke(k.id)}>
                      <ShieldOff className="mr-2 h-4 w-4" /> Revocar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentación</CardTitle>
          <CardDescription>Endpoints disponibles con autenticación por llave.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border p-3 bg-muted/40">
            <div className="font-mono text-xs break-all">Base URL: {BASE_URL || "(configura VITE_SUPABASE_URL)"}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Envía la llave en el header <code>x-api-key</code> o como <code>Authorization: Bearer &lt;key&gt;</code>.
            </div>
          </div>
          {[
            { m: "GET", p: "/invoices", d: "Lista de facturas del dueño de la llave." },
            { m: "GET", p: "/work-orders", d: "Órdenes de trabajo asignadas al dueño." },
            { m: "GET", p: "/bookings", d: "Reservas de equipos del dueño." },
            { m: "POST", p: "/bookings", d: "Crear reserva. Body: { machinery_id, start_date, end_date, notes? }" },
          ].map((e) => (
            <div key={e.p + e.m} className="flex items-start gap-3 border-b pb-2 last:border-b-0">
              <Badge variant={e.m === "GET" ? "secondary" : "default"} className="min-w-[60px] justify-center">
                {e.m}
              </Badge>
              <div className="flex-1">
                <code className="text-xs">{e.p}</code>
                <p className="text-xs text-muted-foreground mt-0.5">{e.d}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog: create */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva llave de API</DialogTitle>
            <DialogDescription>Elige los permisos y el límite de uso.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Integración ERP"
              />
            </div>
            <div>
              <Label>Alcances</Label>
              <div className="space-y-2 mt-2">
                {ALL_SCOPES.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={newScopes.includes(s.id)}
                      onCheckedChange={(v) =>
                        setNewScopes((prev) =>
                          v ? [...prev, s.id] : prev.filter((x) => x !== s.id),
                        )
                      }
                    />
                    <span>{s.label}</span>
                    <code className="text-[10px] text-muted-foreground">{s.id}</code>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Rate limit (req/min)</Label>
              <Input
                type="number"
                min={1}
                max={600}
                value={newRate}
                onChange={(e) => setNewRate(parseInt(e.target.value) || 60)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={create} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar llave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal-once dialog */}
      <Dialog open={!!revealed} onOpenChange={(o) => !o && setRevealed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guarda tu llave ahora</DialogTitle>
            <DialogDescription>
              Esta es la única vez que verás la llave completa. Cópiala y guárdala en un lugar seguro.
            </DialogDescription>
          </DialogHeader>
          {revealed && (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted p-3 font-mono text-xs break-all">
                {revealed.raw}
              </div>
              <Button className="w-full" onClick={() => copy(revealed.raw)}>
                <Copy className="mr-2 h-4 w-4" /> Copiar llave
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevealed(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
