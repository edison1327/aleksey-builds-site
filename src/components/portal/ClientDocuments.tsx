import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, FileText, Download, Trash2, FileArchive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Doc {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  uploaded_by_admin: boolean;
  created_at: string;
}

const MAX_MB = 15;

const fmtSize = (b?: number | null) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

interface Props {
  userId: string;
}

const ClientDocuments = ({ userId }: Props) => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setDocs(data as Doc[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: `Máximo ${MAX_MB} MB.`, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}-${cleanName}`;
      const { error: upErr } = await supabase.storage
        .from("client-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("client_documents").insert({
        user_id: userId,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
        description: description || null,
      });
      if (insErr) throw insErr;

      toast({ title: "Archivo subido" });
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Doc) => {
    const { data, error } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(doc.file_path, 60);
    if (error || !data) {
      toast({ title: "Error", description: error?.message || "No disponible", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`¿Eliminar "${doc.file_name}"?`)) return;
    const { error: rmErr } = await supabase.storage.from("client-documents").remove([doc.file_path]);
    if (rmErr) {
      toast({ title: "Error", description: rmErr.message, variant: "destructive" });
      return;
    }
    await supabase.from("client_documents").delete().eq("id", doc.id);
    setDocs((d) => d.filter((x) => x.id !== doc.id));
    toast({ title: "Eliminado" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <FileArchive className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Subir un documento</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Sube contratos, RUC, planos u otros archivos. Máx {MAX_MB} MB. Solo tú y el equipo de administración pueden verlos.
          </p>
          <Input
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
            />
            {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aún no tienes documentos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardContent className="py-3 flex items-center gap-3 flex-wrap">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{d.file_name}</div>
                  <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                    <span>{fmtSize(d.file_size)}</span>
                    <span>{format(new Date(d.created_at), "PP", { locale: es })}</span>
                    {d.uploaded_by_admin && <span className="text-primary">Enviado por ALEKSEY</span>}
                    {d.description && <span className="italic">"{d.description}"</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleDownload(d)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {!d.uploaded_by_admin && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(d)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientDocuments;
