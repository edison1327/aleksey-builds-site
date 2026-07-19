import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Loader2, FileText, PenTool, RotateCcw } from "lucide-react";
import SEO from "@/components/SEO";

type Contract = {
  id: string;
  code: string;
  title: string;
  customer_name: string;
  customer_email: string | null;
  customer_document: string | null;
  customer_address: string | null;
  amount: number | null;
  currency: string;
  body: string;
  status: string;
  signed_at: string | null;
  signature_data_url: string | null;
};

export default function ContractSignPage() {
  const { token = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [accepted, setAccepted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const empty = useRef(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_contract_by_token" as any, { _token: token });
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      setContract(null);
    } else {
      setContract(Array.isArray(data) ? data[0] : data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const clearSig = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    empty.current = true;
  };

  const point = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const t = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: (t.clientX - rect.left) * (c.width / rect.width), y: (t.clientY - rect.top) * (c.height / rect.height) };
  };
  const start = (e: any) => { drawing.current = true; const p = point(e); const ctx = canvasRef.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (e: any) => {
    if (!drawing.current) return;
    const p = point(e); const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#111";
    ctx.lineTo(p.x, p.y); ctx.stroke(); empty.current = false;
  };
  const end = () => { drawing.current = false; };

  const submit = async () => {
    if (!accepted) return toast.error("Debes aceptar los términos");
    if (empty.current) return toast.error("Firma en el recuadro");
    setSigning(true);
    try {
      const dataUrl = canvasRef.current!.toDataURL("image/png");
      const ua = navigator.userAgent;
      let ip = "";
      try { const r = await fetch("https://api.ipify.org?format=json"); ip = (await r.json()).ip || ""; } catch {}
      const { data, error } = await supabase.rpc("sign_contract_with_token" as any, {
        _token: token, _signature_data_url: dataUrl, _ip: ip, _ua: ua,
      });
      if (error) throw error;
      if (data !== true) throw new Error("El contrato ya no puede firmarse");
      toast.success("Contrato firmado con éxito");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Error al firmar");
    } finally { setSigning(false); }
  };

  if (loading) return <div className="min-h-dvh grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!contract) return (
    <div className="min-h-dvh grid place-items-center p-6">
      <Card className="p-8 max-w-md text-center">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <h1 className="text-xl font-bold">Contrato no encontrado</h1>
        <p className="text-muted-foreground mt-1">El enlace es inválido o el contrato ya no está disponible.</p>
      </Card>
    </div>
  );

  const signed = contract.status === "signed";

  return (
    <div className="min-h-dvh bg-muted/30 py-8 px-4">
      <SEO title={`Firmar contrato ${contract.code}`} description="Firma electrónica de contrato" path={`/firmar/${token}`} />
      <div className="max-w-3xl mx-auto space-y-4">
        <Card className="p-6 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground">Contrato {contract.code}</p>
              <h1 className="text-2xl font-heading font-bold">{contract.title}</h1>
              <p className="text-sm text-muted-foreground">Para: <strong>{contract.customer_name}</strong></p>
            </div>
            {signed && (
              <span className="inline-flex items-center gap-1 text-green-600 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Firmado {contract.signed_at ? new Date(contract.signed_at).toLocaleString("es-PE") : ""}
              </span>
            )}
          </div>
          {contract.amount != null && (
            <p className="text-sm">Monto: <strong>{contract.currency} {Number(contract.amount).toFixed(2)}</strong></p>
          )}
        </Card>

        <Card className="p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap leading-relaxed">
            {contract.body}
          </div>
        </Card>

        {signed ? (
          <Card className="p-6 space-y-2">
            <p className="text-sm font-semibold">Firma registrada</p>
            {contract.signature_data_url && (
              <img src={contract.signature_data_url} alt="Firma" className="border rounded bg-white max-w-xs" />
            )}
          </Card>
        ) : (
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2"><PenTool className="h-4 w-4" /> Firme dentro del recuadro</p>
              <Button size="sm" variant="ghost" onClick={clearSig}><RotateCcw className="h-3 w-3 mr-1" /> Borrar</Button>
            </div>
            <canvas
              ref={canvasRef}
              width={700}
              height={220}
              className="border rounded bg-white w-full touch-none"
              onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
              onTouchStart={start} onTouchMove={move} onTouchEnd={end}
            />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
              <span>He leído y acepto los términos del contrato. Al firmar declaro que la firma es mía y tiene efecto legal.</span>
            </label>
            <Button onClick={submit} disabled={signing} className="w-full">
              {signing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Firmar contrato
            </Button>
            <p className="text-xs text-muted-foreground">Se registrará la fecha, IP y navegador como evidencia.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
