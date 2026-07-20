import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Check, X, PenLine, Eraser, Users, Plus, ClipboardCheck } from "lucide-react";

type Approval = {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  amount: number | null;
  currency: string | null;
  notes: string | null;
  approver_role: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  signature_data: string | null;
  delegated_to: string | null;
  created_at: string;
};

const ENTITY_LABELS: Record<string, string> = {
  invoice: "Factura",
  work_order: "Orden de trabajo",
  purchase_order: "Orden de compra",
  contract: "Contrato",
  other: "Otro",
};

function SignatureCanvas({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = ref.current!;
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
    const rect = ref.current!.getBoundingClientRect();
    const t = e.touches?.[0];
    return { x: (t?.clientX ?? e.clientX) - rect.left, y: (t?.clientY ?? e.clientY) - rect.top };
  };
  const start = (e: any) => { drawing.current = true; const ctx = ref.current!.getContext("2d")!; const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e: any) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; const { x, y } = pos(e); ctx.lineTo(x, y); ctx.stroke(); onChange(ref.current!.toDataURL("image/png")); };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); onChange(null); };

  return (
    <div>
      <canvas
        ref={ref}
        className="border rounded w-full h-40 bg-white touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <Button type="button" variant="ghost" size="sm" onClick={clear} className="mt-1">
        <Eraser className="h-3 w-3 mr-1" /> Limpiar
      </Button>
    </div>
  );
}

export default function AdminApprovals() {
  const [items, setItems] = useState<Approval[]>([]);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Approval | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ entity_type: "invoice", entity_label: "", amount: "", notes: "", approver_role: "admin" });

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`approvals-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "approval_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("approval_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setLoading(false);
    if (error) return toast.error(error.message);
    setItems((data as any) || []);
  };

  const filtered = useMemo(() => tab === "all" ? items : items.filter((i) => i.status === tab), [items, tab]);

  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const approveOne = async (id: string, sig?: string | null) => {
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("approval_requests")
      .update({
        status: "approved",
        approved_by: userRes.user?.id,
        approved_at: new Date().toISOString(),
        signature_data: sig ?? null,
      })
      .eq("id", id);
    if (error) throw error;
  };

  const bulkApprove = async () => {
    if (!selected.size) return toast.error("Selecciona al menos una solicitud");
    if (!signature) return toast.error("Firma requerida para aprobación masiva");
    try {
      for (const id of selected) await approveOne(id, signature);
      toast.success(`${selected.size} aprobadas`);
      setSelected(new Set());
      setSignature(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const bulkReject = async () => {
    if (!selected.size) return toast.error("Selecciona al menos una solicitud");
    if (!rejectReason.trim()) return toast.error("Motivo requerido");
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("approval_requests")
      .update({
        status: "rejected",
        approved_by: userRes.user?.id,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectReason,
      })
      .in("id", Array.from(selected));
    if (error) return toast.error(error.message);
    toast.success(`${selected.size} rechazadas`);
    setSelected(new Set());
    setRejectReason("");
    load();
  };

  const createRequest = async () => {
    if (!form.entity_label.trim()) return toast.error("Descripción requerida");
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("approval_requests").insert({
      entity_type: form.entity_type,
      entity_id: crypto.randomUUID(),
      entity_label: form.entity_label,
      amount: form.amount ? Number(form.amount) : null,
      notes: form.notes || null,
      approver_role: form.approver_role,
      requested_by: userRes.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Solicitud creada");
    setCreateOpen(false);
    setForm({ entity_type: "invoice", entity_label: "", amount: "", notes: "", approver_role: "admin" });
    load();
  };

  const counts = useMemo(() => ({
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  }), [items]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Firma masiva y aprobaciones
          </CardTitle>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva solicitud
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v: any) => { setTab(v); setSelected(new Set()); }}>
            <TabsList>
              <TabsTrigger value="pending">Pendientes ({counts.pending})</TabsTrigger>
              <TabsTrigger value="approved">Aprobadas ({counts.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rechazadas ({counts.rejected})</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4 space-y-3">
              {tab === "pending" && selected.size > 0 && (
                <Card className="border-primary">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4" /> {selected.size} seleccionadas — Aprobación masiva
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Firma</Label>
                        <SignatureCanvas onChange={setSignature} />
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Motivo de rechazo (si aplica)</Label>
                          <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={bulkApprove} disabled={!signature}>
                            <Check className="h-4 w-4 mr-1" /> Aprobar todas
                          </Button>
                          <Button size="sm" variant="destructive" onClick={bulkReject} disabled={!rejectReason.trim()}>
                            <X className="h-4 w-4 mr-1" /> Rechazar todas
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
              {!loading && filtered.length === 0 && <p className="text-sm text-muted-foreground">Sin solicitudes</p>}

              <div className="space-y-2">
                {filtered.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 border rounded hover:bg-muted/40">
                    {a.status === "pending" && (
                      <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} className="mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{ENTITY_LABELS[a.entity_type] || a.entity_type}</Badge>
                        <span className="font-medium truncate">{a.entity_label || a.entity_id}</span>
                        {a.amount != null && (
                          <span className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat("es-CO", { style: "currency", currency: a.currency || "COP", maximumFractionDigits: 0 }).format(a.amount)}
                          </span>
                        )}
                        <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>
                          {a.status}
                        </Badge>
                      </div>
                      {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                      {a.rejection_reason && <p className="text-xs text-destructive mt-1">Rechazado: {a.rejection_reason}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(a.created_at).toLocaleString("es-CO")} · rol: {a.approver_role}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setDetail(a)}>
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.entity_label || "Solicitud"}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div><b>Tipo:</b> {ENTITY_LABELS[detail.entity_type] || detail.entity_type}</div>
              {detail.amount != null && <div><b>Monto:</b> {detail.amount} {detail.currency}</div>}
              {detail.notes && <div><b>Notas:</b> {detail.notes}</div>}
              <div><b>Estado:</b> {detail.status}</div>
              {detail.rejection_reason && <div className="text-destructive"><b>Rechazo:</b> {detail.rejection_reason}</div>}
              {detail.signature_data && (
                <div>
                  <b>Firma:</b>
                  <img src={detail.signature_data} alt="firma" className="border rounded mt-1 max-h-32 bg-white" />
                </div>
              )}
              {detail.status === "pending" && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs">Firmar y aprobar individualmente</Label>
                  <SignatureCanvas onChange={setSignature} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={async () => {
                      if (!signature) return toast.error("Firma requerida");
                      try { await approveOne(detail.id, signature); toast.success("Aprobado"); setDetail(null); setSignature(null); load(); }
                      catch (e: any) { toast.error(e.message); }
                    }}>
                      <PenLine className="h-4 w-4 mr-1" /> Firmar y aprobar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva solicitud de aprobación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción / referencia</Label>
              <Input value={form.entity_label} onChange={(e) => setForm({ ...form, entity_label: e.target.value })} placeholder="Ej: OC-2026-0042" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monto (opcional)</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Rol aprobador</Label>
                <Select value={form.approver_role} onValueChange={(v) => setForm({ ...form, approver_role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="finance">Finanzas</SelectItem>
                    <SelectItem value="operations">Operaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={createRequest} className="w-full">Crear</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
