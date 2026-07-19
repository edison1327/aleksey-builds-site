import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, MapPin, Star } from "lucide-react";
import { useLocations, type Location } from "@/hooks/useLocations";
import { logAction } from "@/lib/auditLog";

type Draft = Omit<Location, "id"> & { id?: string };

const emptyDraft: Draft = {
  name: "",
  slug: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  hours: "",
  lat: null,
  lng: null,
  is_active: true,
  is_primary: false,
  sort_order: 0,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminLocations() {
  const { locations, loading, reload } = useLocations(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const openNew = () => {
    setDraft({ ...emptyDraft, sort_order: locations.length });
    setOpen(true);
  };
  const openEdit = (l: Location) => {
    setDraft({ ...l });
    setOpen(true);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
      return;
    }
    const payload = {
      ...draft,
      slug: (draft.slug || slugify(draft.name)).trim(),
      lat: draft.lat === null || (draft.lat as any) === "" ? null : Number(draft.lat),
      lng: draft.lng === null || (draft.lng as any) === "" ? null : Number(draft.lng),
    };
    setSaving(true);
    try {
      // If setting as primary, unset others first
      if (payload.is_primary) {
        await supabase.from("locations").update({ is_primary: false }).neq("id", payload.id ?? "00000000-0000-0000-0000-000000000000");
      }
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("locations").update(rest).eq("id", id);
        if (error) throw error;
        logAction("update", "locations", id, { name: payload.name });
      } else {
        const { id: _ignored, ...rest } = payload;
        const { data, error } = await supabase.from("locations").insert(rest).select().single();
        if (error) throw error;
        logAction("create", "locations", data?.id, { name: payload.name });
      }
      toast({ title: "Sede guardada" });
      setOpen(false);
      setDraft(null);
      reload();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (l: Location) => {
    if (!confirm(`¿Eliminar la sede "${l.name}"? Los registros asociados quedarán sin sede.`)) return;
    const { error } = await supabase.from("locations").delete().eq("id", l.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    logAction("delete", "locations", l.id, { name: l.name });
    toast({ title: "Sede eliminada" });
    reload();
  };

  const toggleActive = async (l: Location) => {
    await supabase.from("locations").update({ is_active: !l.is_active }).eq("id", l.id);
    reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" /> Sedes
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona las oficinas o sucursales de tu empresa. Asigna maquinaria, vehículos y reservas a cada sede.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Nueva sede
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aún no hay sedes registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((l) => (
            <Card key={l.id} className={l.is_active ? "" : "opacity-60"}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {l.name}
                    {l.is_primary && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                  </CardTitle>
                  <Badge variant={l.is_active ? "default" : "secondary"}>
                    {l.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                {l.city && <p className="text-sm text-muted-foreground">{l.city}</p>}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {l.address && <p>{l.address}</p>}
                {l.phone && <p className="text-muted-foreground">📞 {l.phone}</p>}
                {l.email && <p className="text-muted-foreground">✉️ {l.email}</p>}
                {l.hours && <p className="text-muted-foreground">🕒 {l.hours}</p>}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(l)}>
                    {l.is_active ? "Desactivar" : "Activar"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(l)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar sede" : "Nueva sede"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.slug || slugify(e.target.value) })}
                    placeholder="Sede Lima Norte"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Slug (URL)</label>
                  <Input
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
                    placeholder="lima-norte"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Ciudad</label>
                  <Input value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Dirección</label>
                <Textarea
                  rows={2}
                  value={draft.address ?? ""}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Horario</label>
                  <Input
                    value={draft.hours ?? ""}
                    onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
                    placeholder="Lun-Sáb 8:00–18:00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Latitud</label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={draft.lat ?? ""}
                    onChange={(e) => setDraft({ ...draft, lat: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Longitud</label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={draft.lng ?? ""}
                    onChange={(e) => setDraft({ ...draft, lng: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Orden</label>
                  <Input
                    type="number"
                    value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
                  Activa
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={draft.is_primary} onCheckedChange={(v) => setDraft({ ...draft, is_primary: v })} />
                  Sede principal
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
