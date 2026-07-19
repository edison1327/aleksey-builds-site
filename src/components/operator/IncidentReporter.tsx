import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Camera } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { enqueue } from "@/lib/offlineQueue";
import { compressImage } from "@/lib/imageCompress";


type Incident = {
  id: string;
  severity: string;
  category: string | null;
  title: string;
  description: string | null;
  status: string;
  photo_url: string | null;
  created_at: string;
  reported_by: string | null;
};

const SEV_COLORS: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  high: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  critical: "bg-red-500/15 text-red-700 border-red-500/30",
};

export function IncidentReporter({ workOrderId, userId }: { workOrderId: string; userId: string }) {
  const [items, setItems] = useState<Incident[]>([]);
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState("medium");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("work_order_incidents" as any)
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workOrderId]);

  const submit = async () => {
    if (!title.trim()) { toast.error("Título requerido"); return; }
    setBusy(true);
    try {
      let photo_url: string | null = null;
      let lat: number | null = null, lng: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch {}

      if (photoFile && navigator.onLine) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${userId}/${workOrderId}/incident/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("work-order-media")
          .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
        if (!upErr) {
          const { data: signed } = await supabase.storage
            .from("work-order-media")
            .createSignedUrl(path, 60 * 60 * 24 * 365);
          photo_url = signed?.signedUrl || null;
        }
      }

      const payload = {
        work_order_id: workOrderId,
        reported_by: userId,
        severity, category: category || null,
        title: title.trim(),
        description: description.trim() || null,
        photo_url, lat, lng,
      };

      if (!navigator.onLine) {
        enqueue({
          table: "work_order_incidents",
          action: "insert",
          payload,
          label: `Incidencia: ${title}`,
        });
        toast.info("Sin conexión: incidencia en cola");
      } else {
        const { error } = await supabase.from("work_order_incidents" as any).insert(payload);
        if (error) throw error;
        toast.success("Incidencia reportada");
      }
      setOpen(false); setTitle(""); setDescription(""); setCategory(""); setSeverity("medium"); setPhotoFile(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Incidencias ({items.length})
        </p>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Reportar
        </Button>
      </div>

      {open && (
        <div className="rounded-md border border-border p-3 space-y-2 mb-3 bg-muted/30">
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Categoría (ej. eléctrico, seguridad)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input placeholder="Título breve" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea rows={3} placeholder="Descripción del problema" value={description} onChange={(e) => setDescription(e.target.value)} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Camera className="h-4 w-4" />
            <span>{photoFile ? photoFile.name : "Adjuntar foto (opcional)"}</span>
            <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
          </label>
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={busy}>{busy ? "Enviando…" : "Enviar"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin incidencias reportadas</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="rounded-md border border-border p-2 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={SEV_COLORS[i.severity]}>{i.severity}</Badge>
                <span className="font-medium">{i.title}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{i.status}</Badge>
              </div>
              {i.category && <p className="text-xs text-muted-foreground mt-1">{i.category}</p>}
              {i.description && <p className="text-xs mt-1 whitespace-pre-wrap">{i.description}</p>}
              {i.photo_url && <img src={i.photo_url} className="mt-2 max-h-32 rounded border border-border" alt="" loading="lazy" />}
              <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(i.created_at), "dd MMM HH:mm", { locale: es })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
