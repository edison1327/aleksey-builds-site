import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Image as ImageIcon, Loader2, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { logAction } from "@/lib/auditLog";

interface MediaFile {
  name: string;
  path: string; // full path inside bucket
  url: string;
  size: number;
  updated_at: string | null;
}

const BUCKET = "site-images";

/**
 * Centralised media library: lists every image in the `site-images` bucket
 * (recursively), with search, copy URL, open, upload and delete.
 */
const AdminMediaLibrary = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const listAll = useCallback(async () => {
    setLoading(true);
    try {
      const all: MediaFile[] = [];

      const walk = async (prefix: string) => {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .list(prefix, { limit: 1000, sortBy: { column: "updated_at", order: "desc" } });
        if (error) throw error;
        for (const item of data || []) {
          // Folders have no `id`; files have one
          if (!(item as any).id) {
            await walk(prefix ? `${prefix}/${item.name}` : item.name);
          } else {
            const path = prefix ? `${prefix}/${item.name}` : item.name;
            const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
            all.push({
              name: item.name,
              path,
              url: pub.publicUrl,
              size: (item.metadata as any)?.size ?? 0,
              updated_at: item.updated_at ?? null,
            });
          }
        }
      };

      await walk("");
      setFiles(all);
    } catch (err) {
      console.error("MediaLibrary list error", err);
      toast({ title: "Error", description: "No se pudo cargar la biblioteca.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    listAll();
  }, [listAll]);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({ title: "URL copiada" });
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`¿Eliminar "${file.path}"? Si está en uso, las imágenes dejarán de cargar.`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove([file.path]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    logAction("delete", "storage:site-images", null, { path: file.path });
    toast({ title: "Eliminado", description: file.name });
    setFiles((prev) => prev.filter((f) => f.path !== file.path));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `library/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      logAction("upload", "storage:site-images", null, { path });
      toast({ title: "Subido", description: file.name });
      await listAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo subir.", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const filtered = files.filter((f) =>
    !search.trim() ||
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.path.toLowerCase().includes(search.toLowerCase()),
  );

  const totalSizeMB = (files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6" /> Biblioteca de medios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {files.length} archivos · {totalSizeMB} MB en bucket <code className="bg-muted px-1 rounded">{BUCKET}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={listAll} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} /> Refrescar
          </Button>
          <label>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            <Button asChild size="sm" disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                Subir
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o carpeta..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {files.length === 0 ? "No hay imágenes en el bucket todavía." : "No hay resultados para esa búsqueda."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((f) => (
            <Card key={f.path} className="overflow-hidden group">
              <div className="relative aspect-square bg-muted">
                <img
                  src={f.url}
                  alt={f.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center gap-1 p-2 opacity-0 group-hover:opacity-100">
                  <Button size="icon" variant="secondary" className="h-8 w-8" title="Copiar URL" onClick={() => handleCopy(f.url)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8" title="Abrir" asChild>
                    <a href={f.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" title="Eliminar" onClick={() => handleDelete(f)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-2 text-[11px] space-y-0.5">
                <p className="truncate font-medium" title={f.path}>{f.name}</p>
                <p className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMediaLibrary;
