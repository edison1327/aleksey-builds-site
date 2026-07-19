import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { loadPdfSettings, savePdfSettings, DEFAULT_PDF_SETTINGS, type PdfSettings } from "@/lib/pdfSettings";
import { exportWorkOrderPdf } from "@/lib/pdfExport";
import { FileDown, Save, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminPdfSettings() {
  const [s, setS] = useState<PdfSettings>(DEFAULT_PDF_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Debe ser una imagen"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Máx 2MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `pdf-logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-images").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("site-images").getPublicUrl(path);
      setS((prev) => ({ ...prev, logo_url: data.publicUrl }));
      toast.success("Logo subido. Guarda para aplicar.");
    } catch (e: any) {
      toast.error(e.message || "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadPdfSettings().then((data) => { setS(data); setLoading(false); });
  }, []);

  const update = <K extends keyof PdfSettings>(k: K, v: PdfSettings[K]) => setS({ ...s, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      await savePdfSettings(s);
      toast.success("Configuración guardada");
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    await exportWorkOrderPdf({
      code: "PREVIEW-001",
      title: "Vista previa de personalización PDF",
      description: "Este es un PDF de ejemplo con la configuración actual de tu empresa.",
      customer_name: "Cliente Demo S.A.C.",
      customer_email: "demo@ejemplo.com",
      customer_phone: "+51 999 999 999",
      site_address: "Av. Principal 123, Lima",
      status: "in_progress",
      priority: "high",
      scheduled_start: new Date().toISOString(),
      scheduled_end: new Date(Date.now() + 3600 * 4000).toISOString(),
      estimated_cost: 1500,
      actual_cost: 1420,
      checklist: [
        { label: "Inspección inicial del equipo", done: true },
        { label: "Verificación de niveles y filtros", done: true },
        { label: "Prueba de funcionamiento", done: false },
      ],
      notes: "Este PDF utiliza el color, logo y datos configurados en el panel.",
    });
  };

  if (loading) return <div className="p-6 text-muted-foreground">Cargando…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Personalización de PDFs</h2>
          <p className="text-sm text-muted-foreground">Estos datos aparecen en calendarios, OT y cotizaciones exportadas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={preview}><FileDown className="h-4 w-4 mr-1" /> Vista previa</Button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" /> Guardar</Button>
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Nombre de empresa *</Label>
            <Input value={s.company_name} onChange={(e) => update("company_name", e.target.value)} />
          </div>
          <div>
            <Label>Eslogan / subtítulo</Label>
            <Input value={s.tagline || ""} onChange={(e) => update("tagline", e.target.value)} />
          </div>
          <div>
            <Label>Color principal (cabecera)</Label>
            <div className="flex gap-2 items-center">
              <Input type="color" value={s.primary_color} onChange={(e) => update("primary_color", e.target.value)} className="w-16 h-10 p-1" />
              <Input value={s.primary_color} onChange={(e) => update("primary_color", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={s.phone || ""} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={s.email || ""} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <Label>Sitio web</Label>
            <Input value={s.website || ""} onChange={(e) => update("website", e.target.value)} />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input value={s.address || ""} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Logo para PDFs</Label>
            <div className="flex items-start gap-3 flex-wrap">
              {s.logo_url ? (
                <div className="relative">
                  <img src={s.logo_url} alt="Logo" className="h-20 w-20 object-contain rounded-md border border-border bg-white p-1" />
                  <button
                    type="button"
                    onClick={() => update("logo_url", "")}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    aria-label="Quitar logo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">Sin logo</div>
              )}
              <div className="flex-1 min-w-[240px] space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ""; }}
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-1" /> {uploading ? "Subiendo…" : "Subir logo"}
                </Button>
                <Input value={s.logo_url || ""} onChange={(e) => update("logo_url", e.target.value)} placeholder="o pega una URL https://…" />
                <p className="text-xs text-muted-foreground">PNG/JPG/WebP cuadrado, máx 2MB. Se sube al almacenamiento público del sitio.</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Label>Nota de pie de página</Label>
          <Textarea value={s.footer_note || ""} rows={2} onChange={(e) => update("footer_note", e.target.value)} placeholder="RUC, condiciones, disclaimer, etc." />
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-muted-foreground">
          <strong>Consejo:</strong> Usa un logo PNG cuadrado sin fondo. Si el logo no aparece en el PDF, verifica que la URL sea accesible públicamente (CORS habilitado).
        </div>
      </Card>
    </div>
  );
}
