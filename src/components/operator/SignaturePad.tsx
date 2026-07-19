import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eraser, Check } from "lucide-react";

type Props = {
  onSave: (dataUrl: string, name: string) => Promise<void> | void;
  disabled?: boolean;
};

export function SignaturePad({ onSave, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
  }, []);

  const pos = (e: any) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const t = e.touches?.[0];
    return { x: (t ? t.clientX : e.clientX) - r.left, y: (t ? t.clientY : e.clientY) - r.top };
  };

  const start = (e: any) => {
    e.preventDefault();
    drawing.current = true;
    setEmpty(false);
    const { x, y } = pos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: any) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => { drawing.current = false; };

  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
  };

  const save = async () => {
    if (empty || !name.trim()) return;
    setSaving(true);
    try {
      await onSave(canvasRef.current!.toDataURL("image/png"), name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input placeholder="Nombre del cliente" value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} />
      <div className="rounded-md border border-border bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none rounded-md"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={clear} disabled={disabled || empty}>
          <Eraser className="h-4 w-4 mr-1" /> Borrar
        </Button>
        <Button size="sm" onClick={save} disabled={disabled || empty || !name.trim() || saving}>
          <Check className="h-4 w-4 mr-1" /> {saving ? "Guardando…" : "Confirmar firma"}
        </Button>
      </div>
    </div>
  );
}
