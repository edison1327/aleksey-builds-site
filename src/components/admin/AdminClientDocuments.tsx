import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

interface ClientDoc {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  uploaded_by_admin: boolean;
  created_at: string;
}

interface ClientOption {
  user_id: string;
  email: string;
  doc_count: number;
}

const MAX_MB = 15;

export default function AdminClientDocuments() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<ClientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  // Upload form
  const [targetUserId, setTargetUserId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [emailLookup, setEmailLookup] = useState<Record<string, string>>({});

  const loadDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setDocs((data as ClientDoc[]) ?? []);
    setLoading(false);
  };

  const loadEmails = async () => {
    // Best-effort: pull emails from contact_messages / equipment_bookings by matching auth user_ids
    // Here we simply group by user_id and show first 8 chars fallback.
    const { data: cm } = await supabase
      .from("contact_messages")
      .select("user_id, email")
      .not("user_id", "is", null);
    const map: Record<string, string> = {};
    (cm ?? []).forEach((r: any) => {
      if (r.user_id && r.email && !map[r.user_id]) map[r.user_id] = r.email;
    });
    setEmailLookup(map);
  };

  useEffect(() => {
    loadDocs();
    loadEmails();
  }, []);

  const clients: ClientOption[] = useMemo(() => {
    const groups = new Map<string, number>();
    docs.forEach((d) => groups.set(d.user_id, (groups.get(d.user_id) ?? 0) + 1));
    return Array.from(groups.entries()).map(([user_id, doc_count]) => ({
      user_id,
      email: emailLookup[user_id] ?? user_id.slice(0, 8) + "…",
      doc_count,
    }));
  }, [docs, emailLookup]);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (selectedUser !== "all" && d.user_id !== selectedUser) return false;
      if (search) {
        const s = search.toLowerCase();
        const email = (emailLookup[d.user_id] ?? "").toLowerCase();
        if (
          !d.file_name.toLowerCase().includes(s) &&
          !(d.description ?? "").toLowerCase().includes(s) &&
          !email.includes(s) &&
          !d.user_id.includes(s)
        )
          return false;
      }
      return true;
    });
  }, [docs, search, selectedUser, emailLookup]);

  const handleUpload = async () => {
    if (!targetUserId.trim() || !file) {
      toast({ title: "Faltan datos", description: "Selecciona cliente y archivo", variant: "destructive" });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: `Máx ${MAX_MB} MB`, variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${targetUserId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("client-documents")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      toast({ title: "Error al subir", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { error: insErr } = await supabase.from("client_documents").insert({
      user_id: targetUserId,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      description: description || null,
      uploaded_by_admin: true,
    });
    if (insErr) {
      await supabase.storage.from("client-documents").remove([path]);
      toast({ title: "Error", description: insErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    toast({ title: "Documento enviado al cliente" });
    setFile(null);
    setDescription("");
    setUploading(false);
    loadDocs();
  };

  const handleDownload = async (doc: ClientDoc) => {
    const { data, error } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(doc.file_path, 60);
    if (error || !data) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (doc: ClientDoc) => {
    if (!confirm(`Eliminar "${doc.file_name}"?`)) return;
    await supabase.storage.from("client-documents").remove([doc.file_path]);
    const { error } = await supabase.from("client_documents").delete().eq("id", doc.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Eliminado" });
    loadDocs();
  };

  const formatBytes = (b: number | null) => {
    if (!b) return "—";
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documentos de Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Envía archivos a clientes autenticados y gestiona los que ellos suben.
        </p>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> Enviar documento a cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Cliente</Label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 && (
                    <SelectItem value="none" disabled>
                      Sin clientes con documentos aún — pega ID manual abajo
                    </SelectItem>
                  )}
                  {clients.map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      {c.email} · {c.doc_count} docs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                placeholder="…o pega UUID del usuario"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              />
            </div>
            <div>
              <Label>Archivo (≤{MAX_MB} MB)</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  {file.name} · {formatBytes(file.size)}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contrato firmado, cotización final, etc."
            />
          </div>
          <Button onClick={handleUpload} disabled={uploading || !file || !targetUserId}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Subiendo…" : "Enviar al cliente"}
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por archivo, descripción, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.user_id} value={c.user_id}>
                {c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            Sin documentos.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <Card key={d.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{d.file_name}</p>
                      {d.uploaded_by_admin ? (
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="h-3 w-3" /> Enviado por ALEKSEY
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <UserIcon className="h-3 w-3" /> Subido por cliente
                        </Badge>
                      )}
                    </div>
                    {d.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {emailLookup[d.user_id] ?? d.user_id} · {formatBytes(d.file_size)} ·{" "}
                      {format(new Date(d.created_at), "PPp", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDownload(d)}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Descargar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(d)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
