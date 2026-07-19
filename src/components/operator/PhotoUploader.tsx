import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { compressImage, formatBytes } from "@/lib/imageCompress";


type Photo = {
  id: string;
  storage_path: string;
  kind: string;
  caption: string | null;
  created_at: string;
  uploaded_by: string | null;
  _url?: string;
};

type Props = {
  workOrderId: string;
  userId: string;
  kind: "before" | "after";
  label: string;
};

export function PhotoUploader({ workOrderId, userId, kind, label }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);


  const load = async () => {
    const { data } = await supabase
      .from("work_order_photos")
      .select("*")
      .eq("work_order_id", workOrderId)
      .eq("kind", kind)
      .order("created_at", { ascending: false });
    const rows = (data as Photo[]) || [];
    // Get signed URLs
    for (const p of rows) {
      const { data: signed } = await supabase.storage
        .from("work-order-media")
        .createSignedUrl(p.storage_path, 3600);
      p._url = signed?.signedUrl;
    }
    setPhotos(rows);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workOrderId, kind]);

  const handleFile = async (file: File) => {
    setUploading(true);
    setProgress("Comprimiendo…");
    try {
      // Try to get GPS
      let lat: number | null = null, lng: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch { /* ignore */ }

      // Compress (skip if already very small)
      let toUpload: Blob = file;
      let originalSize = file.size, compressedSize = file.size;
      if (file.size > 300 * 1024) {
        const c = await compressImage(file, { maxDim: 1600, quality: 0.82 });
        toUpload = c.blob;
        originalSize = c.originalSize;
        compressedSize = c.compressedSize;
      }

      setProgress(`Subiendo (${formatBytes(compressedSize)})…`);
      const path = `${userId}/${workOrderId}/${kind}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("work-order-media")
        .upload(path, toUpload, { contentType: "image/jpeg", upsert: false });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from("work_order_photos").insert({
        work_order_id: workOrderId,
        kind,
        storage_path: path,
        uploaded_by: userId,
        lat, lng,
      });
      if (dbErr) throw dbErr;
      const saved = originalSize > compressedSize
        ? `Foto subida · ahorrado ${formatBytes(originalSize - compressedSize)}`
        : "Foto subida";
      toast.success(saved);
      load();
    } catch (e: any) {
      toast.error(e.message || "Error subiendo foto");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };


  const remove = async (p: Photo) => {
    if (!confirm("¿Eliminar foto?")) return;
    await supabase.storage.from("work-order-media").remove([p.storage_path]);
    await supabase.from("work_order_photos").delete().eq("id", p.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
          <ImageIcon className="h-3 w-3" /> {label}
        </p>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
          {uploading ? (progress || "Subiendo…") : "Cámara"}

        </Button>
        <input
          ref={inputRef} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      {photos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin fotos aún</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative group">
              {p._url && <img src={p._url} alt={p.caption || ""} className="w-full h-20 object-cover rounded-md border border-border" loading="lazy" />}
              {p.uploaded_by === userId && (
                <button
                  onClick={() => remove(p)}
                  className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
