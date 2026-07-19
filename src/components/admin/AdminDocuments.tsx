import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderLock, Upload, Download, Trash2, History, AlertTriangle, Search, Loader2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

type Doc = {
  id: string;
  title: string;
  description: string | null;
  doc_type: string;
  entity_type: string | null;
  entity_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  version: number;
  parent_id: string | null;
  is_current: boolean;
  tags: string[] | null;
  issued_at: string | null;
  expires_at: string | null;
  visibility: string;
  client_email: string | null;
  supplier_id: string | null;
  created_at: string;
};

const DOC_TYPES = [
  { v: "contract", l: "Contrato" },
  { v: "invoice", l: "Factura" },
  { v: "certification", l: "Certificación" },
  { v: "manual", l: "Manual" },
  { v: "permit", l: "Permiso" },
  { v: "insurance", l: "Seguro" },
  { v: "photo", l: "Foto de obra" },
  { v: "other", l: "Otro" },
];

const ENTITY_TYPES = [
  { v: "", l: "—" },
  { v: "client", l: "Cliente" },
  { v: "supplier", l: "Proveedor" },
  { v: "employee", l: "Empleado" },
  { v: "project", l: "Proyecto" },
  { v: "work_order", l: "Orden de trabajo" },
  { v: "machinery", l: "Maquinaria" },
];

const VISIBILITY = [
  { v: "internal", l: "Interno" },
  { v: "client", l: "Cliente" },
  { v: "supplier", l: "Proveedor" },
  { v: "public", l: "Público" },
];

const fmtSize = (b?: number | null) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

const expiryBadge = (d: string | null) => {
  if (!d) return null;
  const days = Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return <Badge variant="destructive">Vencido</Badge>;
  if (days <= 7) return <Badge className="bg-orange-500 text-white">{days}d</Badge>;
  if (days <= 30) return <Badge className="bg-yellow-500 text-black">{days}d</Badge>;
  return <Badge variant="secondary">{days}d</Badge>;
};

export default function AdminDocuments() {
  const { user, isAdmin } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showExpiring, setShowExpiring] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [versionsOf, setVersionsOf] = useState<Doc | null>(null);
  const [versions, setVersions] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    doc_type: "other",
    entity_type: "",
    entity_id: "",
    tags: "",
    issued_at: "",
    expires_at: "",
    visibility: "internal",
    client_email: "",
    parent_id: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    else setDocs((data as Doc[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (!d.is_current && !versionsOf) return false;
      if (typeFilter !== "all" && d.doc_type !== typeFilter) return false;
      if (showExpiring) {
        if (!d.expires_at) return false;
        const days = Math.floor((new Date(d.expires_at).getTime() - Date.now()) / 86400000);
        if (days > 30) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        if (
          !d.title.toLowerCase().includes(s) &&
          !(d.description || "").toLowerCase().includes(s) &&
          !(d.tags || []).some((t) => t.toLowerCase().includes(s))
        ) return false;
      }
      return true;
    });
  }, [docs, typeFilter, search, showExpiring, versionsOf]);

  const expiringCount = useMemo(() =>
    docs.filter((d) => d.is_current && d.expires_at &&
      new Date(d.expires_at).getTime() - Date.now() < 30 * 86400000).length,
    [docs]);

  const resetForm = () => {
    setForm({ title: "", description: "", doc_type: "other", entity_type: "", entity_id: "", tags: "", issued_at: "", expires_at: "", visibility: "internal", client_email: "", parent_id: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (asNewVersionOf?: Doc) => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Selecciona un archivo"); return; }
    if (!form.title.trim() && !asNewVersionOf) { toast.error("Título requerido"); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user?.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;

      const parentDoc = asNewVersionOf;
      const parent_id = parentDoc ? (parentDoc.parent_id || parentDoc.id) : null;
      const nextVersion = parentDoc ? (parentDoc.version + 1) : 1;

      const insert = {
        title: parentDoc?.title || form.title,
        description: form.description || parentDoc?.description || null,
        doc_type: parentDoc?.doc_type || form.doc_type,
        entity_type: parentDoc?.entity_type || form.entity_type || null,
        entity_id: parentDoc?.entity_id || form.entity_id || null,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        version: nextVersion,
        parent_id,
        is_current: true,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : (parentDoc?.tags || []),
        issued_at: form.issued_at || null,
        expires_at: form.expires_at || null,
        visibility: parentDoc?.visibility || form.visibility,
        client_email: form.client_email || parentDoc?.client_email || null,
        uploaded_by: user?.id,
      };
      const { error: insErr } = await supabase.from("documents").insert(insert);
      if (insErr) throw insErr;

      toast.success(parentDoc ? "Nueva versión subida" : "Documento subido");
      setUploadOpen(false);
      resetForm();
      await load();
      if (versionsOf) await loadVersions(versionsOf);
    } catch (e: any) {
      toast.error(e.message || "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const loadVersions = async (d: Doc) => {
    const rootId = d.parent_id || d.id;
    const { data } = await supabase
      .from("documents").select("*")
      .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
      .order("version", { ascending: false });
    setVersions((data as Doc[]) || []);
    setVersionsOf(d);
  };

  const downloadDoc = async (d: Doc) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(d.storage_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const deleteDoc = async (d: Doc) => {
    if (!confirm(`¿Eliminar "${d.title}" v${d.version}?`)) return;
    await supabase.storage.from("documents").remove([d.storage_path]);
    const { error } = await supabase.from("documents").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
    if (versionsOf) loadVersions(versionsOf);
  };

  const rollback = async (d: Doc) => {
    if (!confirm(`¿Restaurar v${d.version} como vigente?`)) return;
    const rootId = d.parent_id || d.id;
    await supabase.from("documents").update({ is_current: false })
      .or(`id.eq.${rootId},parent_id.eq.${rootId}`);
    const { error } = await supabase.from("documents").update({ is_current: true }).eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Versión restaurada");
    load(); loadVersions(d);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FolderLock className="h-6 w-6" /> Centro de Documentos</h2>
          <p className="text-muted-foreground text-sm">Biblioteca central con versionado, permisos y alertas de expiración.</p>
        </div>
        <div className="flex items-center gap-2">
          {expiringCount > 0 && (
            <Button variant={showExpiring ? "default" : "outline"} size="sm" onClick={() => setShowExpiring((v) => !v)}>
              <AlertTriangle className="h-4 w-4 mr-2" />{expiringCount} por vencer
            </Button>
          )}
          <Dialog open={uploadOpen} onOpenChange={(o) => { setUploadOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Upload className="h-4 w-4 mr-2" />Subir documento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nuevo documento</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div><Label>Archivo *</Label><Input ref={fileRef} type="file" /></div>
                <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Descripción</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tipo</Label>
                    <Select value={form.doc_type} onValueChange={(v) => setForm({ ...form, doc_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Visibilidad</Label>
                    <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{VISIBILITY.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Entidad</Label>
                    <Select value={form.entity_type || "none"} onValueChange={(v) => setForm({ ...form, entity_type: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {ENTITY_TYPES.filter((e) => e.v).map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>ID entidad (opcional)</Label><Input value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} /></div>
                </div>
                {form.visibility === "client" && (
                  <div><Label>Email cliente</Label><Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} /></div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Emitido</Label><Input type="date" value={form.issued_at} onChange={(e) => setForm({ ...form, issued_at: e.target.value })} /></div>
                  <div><Label>Expira</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
                </div>
                <div><Label>Etiquetas (coma)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ISO, 2026, obra-lima" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button>
                <Button onClick={() => handleUpload()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Subir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar por título, descripción o etiqueta" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {DOC_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader><TableRow>
              <TableHead>Documento</TableHead><TableHead>Tipo</TableHead><TableHead>Entidad</TableHead>
              <TableHead>Vis.</TableHead><TableHead>v</TableHead><TableHead>Tamaño</TableHead>
              <TableHead>Expira</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Sin documentos</TableCell></TableRow>
              ) : filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{d.title}</div>
                    {d.tags && d.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {d.tags.slice(0, 4).map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{DOC_TYPES.find((t) => t.v === d.doc_type)?.l || d.doc_type}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.entity_type || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{d.visibility}</Badge></TableCell>
                  <TableCell>{d.version}</TableCell>
                  <TableCell className="text-xs">{fmtSize(d.size_bytes)}</TableCell>
                  <TableCell>{d.expires_at ? <>{d.expires_at} {expiryBadge(d.expires_at)}</> : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => downloadDoc(d)} title="Descargar"><Download className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => loadVersions(d)} title="Versiones"><History className="h-4 w-4" /></Button>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" onClick={() => deleteDoc(d)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!versionsOf} onOpenChange={(o) => { if (!o) { setVersionsOf(null); setVersions([]); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Versiones — {versionsOf?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{versions.length} versión(es)</p>
              <Button size="sm" variant="outline" onClick={() => { fileRef.current?.click(); }}>
                <Upload className="h-4 w-4 mr-2" />Subir nueva versión
              </Button>
              <input ref={fileRef} type="file" className="hidden" onChange={() => versionsOf && handleUpload(versionsOf)} />
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>v</TableHead><TableHead>Archivo</TableHead><TableHead>Subido</TableHead>
                <TableHead>Vigente</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>v{v.version}</TableCell>
                    <TableCell className="text-xs">{v.file_name}</TableCell>
                    <TableCell className="text-xs">{new Date(v.created_at).toLocaleString()}</TableCell>
                    <TableCell>{v.is_current ? <Badge>Actual</Badge> : <Badge variant="outline">—</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => downloadDoc(v)}><Download className="h-4 w-4" /></Button>
                        {!v.is_current && (
                          <Button size="sm" variant="outline" onClick={() => rollback(v)}>Restaurar</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
