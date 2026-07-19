import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { loadPdfSettings, savePdfSettings, DEFAULT_PDF_SETTINGS, type PdfSettings } from "@/lib/pdfSettings";
import { exportWorkOrderPdf } from "@/lib/pdfExport";
import { FileDown, Save } from "lucide-react";

export default function AdminPdfSettings() {
  const [s, setS] = useState<PdfSettings>(DEFAULT_PDF_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
            <Label>URL del logo (PNG cuadrado)</Label>
            <Input value={s.logo_url || ""} onChange={(e) => update("logo_url", e.target.value)} placeholder="https://…" />
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
