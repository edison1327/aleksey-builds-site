import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Truck, ShieldCheck, FileText, AlertTriangle, Handshake, Star, History, Trophy, ClipboardCheck } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Supplier = {
  id: string; name: string; ruc: string | null; contact_name: string | null;
  email: string | null; phone: string | null; category: string | null; address: string | null;
  rating: number | null; status: string; notes: string | null;
};
type Cert = {
  id: string; supplier_id: string; cert_type: string; cert_number: string | null;
  issuer: string | null; issued_at: string | null; expires_at: string | null;
  file_url: string | null; notes: string | null;
};
type Subcontract = {
  id: string; code: string; supplier_id: string; work_order_id: string | null;
  title: string; scope: string | null; amount: number | null; currency: string;
  start_date: string | null; end_date: string | null; status: string;
  payment_terms: string | null; notes: string | null;
};
type Evaluation = {
  id: string; supplier_id: string; subcontract_id: string | null; project_id: string | null; project_name: string | null;
  quality_score: number; punctuality_score: number; safety_score: number; communication_score: number;
  overall_score: number | null; would_rehire: boolean; comments: string | null; evaluated_at: string;
};
type ProjectLite = { id: string; title: string };

const STATUS = { active: "Activo", suspended: "Suspendido", blacklisted: "Lista negra" } as Record<string,string>;
const SC_STATUS = { draft: "Borrador", sent: "Enviado", signed: "Firmado", in_progress: "En curso", completed: "Completado", cancelled: "Cancelado" } as Record<string,string>;

export default function AdminSuppliers() {
  const [tab, setTab] = useState<"suppliers"|"certs"|"subcontracts"|"evaluations"|"ranking"|"pending">("suppliers");
  const [ranking, setRanking] = useState<any[]>([]);
  const [rankingCategory, setRankingCategory] = useState("");
  const [rankingLoading, setRankingLoading] = useState(false);
  const [pending, setPending] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [subs, setSubs] = useState<Subcontract[]>([]);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [editS, setEditS] = useState<Supplier | null>(null);
  const [openS, setOpenS] = useState(false);
  const [editC, setEditC] = useState<Cert | null>(null);
  const [openC, setOpenC] = useState(false);
  const [editSc, setEditSc] = useState<Subcontract | null>(null);
  const [openSc, setOpenSc] = useState(false);
  const [editEv, setEditEv] = useState<Evaluation | null>(null);
  const [openEv, setOpenEv] = useState(false);
  const [historySupplier, setHistorySupplier] = useState<Supplier | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: c }, { data: sc }, { data: ev }, { data: pr }] = await Promise.all([
      supabase.from("suppliers" as any).select("*").order("name"),
      supabase.from("supplier_certifications" as any).select("*").order("expires_at"),
      supabase.from("subcontracts" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("supplier_evaluations" as any).select("*").order("evaluated_at", { ascending: false }),
      supabase.from("projects" as any).select("id,title").is("deleted_at", null).order("title"),
    ]);
    setSuppliers((s as any) || []);
    setCerts((c as any) || []);
    setSubs((sc as any) || []);
    setEvals((ev as any) || []);
    setProjects((pr as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const supplierName = (id: string) => suppliers.find(x => x.id === id)?.name || "—";

  const expiringCerts = useMemo(() => certs.filter(c => c.expires_at && differenceInDays(parseISO(c.expires_at), new Date()) <= 30), [certs]);

  const filteredS = useMemo(() => {
    const t = q.toLowerCase();
    if (!t) return suppliers;
    return suppliers.filter(s => [s.name, s.ruc, s.email, s.category].filter(Boolean).some(v => v!.toLowerCase().includes(t)));
  }, [suppliers, q]);

  // Supplier CRUD
  const newS = () => { setEditS({ id: "", name: "", ruc: "", contact_name: "", email: "", phone: "", category: "", address: "", rating: null, status: "active", notes: "" } as any); setOpenS(true); };
  const saveS = async () => {
    if (!editS) return;
    if (!editS.name) return toast.error("Nombre requerido");
    const { id, ...rest } = editS as any;
    const { error } = id
      ? await supabase.from("suppliers" as any).update(rest).eq("id", id)
      : await supabase.from("suppliers" as any).insert(rest);
    if (error) return toast.error(error.message);
    toast.success("Proveedor guardado"); setOpenS(false); setEditS(null); load();
  };
  const delS = async (id: string) => {
    if (!confirm("¿Eliminar proveedor y sus certificaciones?")) return;
    const { error } = await supabase.from("suppliers" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  // Cert CRUD
  const newC = (sid?: string) => { setEditC({ id: "", supplier_id: sid || suppliers[0]?.id || "", cert_type: "", cert_number: "", issuer: "", issued_at: "", expires_at: "", file_url: "", notes: "" } as any); setOpenC(true); };
  const saveC = async () => {
    if (!editC) return;
    if (!editC.supplier_id || !editC.cert_type) return toast.error("Proveedor y tipo requeridos");
    const { id, ...rest } = editC as any;
    // normalize empty dates
    if (!rest.issued_at) rest.issued_at = null;
    if (!rest.expires_at) rest.expires_at = null;
    const { error } = id
      ? await supabase.from("supplier_certifications" as any).update(rest).eq("id", id)
      : await supabase.from("supplier_certifications" as any).insert(rest);
    if (error) return toast.error(error.message);
    toast.success("Certificación guardada"); setOpenC(false); setEditC(null); load();
  };
  const delC = async (id: string) => {
    if (!confirm("¿Eliminar certificación?")) return;
    const { error } = await supabase.from("supplier_certifications" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  // Subcontract CRUD
  const newSc = () => { setEditSc({ id: "", code: `SUB-${Date.now().toString().slice(-6)}`, supplier_id: suppliers[0]?.id || "", work_order_id: null, title: "", scope: "", amount: null, currency: "PEN", start_date: "", end_date: "", status: "draft", payment_terms: "", notes: "" } as any); setOpenSc(true); };
  const saveSc = async () => {
    if (!editSc) return;
    if (!editSc.supplier_id || !editSc.title) return toast.error("Proveedor y título requeridos");
    const { id, ...rest } = editSc as any;
    if (!rest.start_date) rest.start_date = null;
    if (!rest.end_date) rest.end_date = null;
    if (!rest.work_order_id) rest.work_order_id = null;
    const { error } = id
      ? await supabase.from("subcontracts" as any).update(rest).eq("id", id)
      : await supabase.from("subcontracts" as any).insert(rest);
    if (error) return toast.error(error.message);
    toast.success("Subcontrato guardado"); setOpenSc(false); setEditSc(null); load();
  };
  const delSc = async (id: string) => {
    if (!confirm("¿Eliminar subcontrato?")) return;
    const { error } = await supabase.from("subcontracts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  // Evaluation CRUD
  const newEv = (sid?: string) => { setEditEv({ id: "", supplier_id: sid || suppliers[0]?.id || "", subcontract_id: null, project_id: null, project_name: "", quality_score: 4, punctuality_score: 4, safety_score: 4, communication_score: 4, overall_score: null, would_rehire: true, comments: "", evaluated_at: new Date().toISOString().slice(0,10) } as any); setOpenEv(true); };
  const saveEv = async () => {
    if (!editEv) return;
    if (!editEv.supplier_id) return toast.error("Proveedor requerido");
    const { id, overall_score, ...rest } = editEv as any;
    if (!rest.subcontract_id) rest.subcontract_id = null;
    const { data: userRes } = await supabase.auth.getUser();
    if (!id) rest.evaluated_by = userRes.user?.id;
    const { error } = id
      ? await supabase.from("supplier_evaluations" as any).update(rest).eq("id", id)
      : await supabase.from("supplier_evaluations" as any).insert(rest);
    if (error) return toast.error(error.message);
    toast.success("Evaluación guardada"); setOpenEv(false); setEditEv(null); load();
  };
  const delEv = async (id: string) => {
    if (!confirm("¿Eliminar evaluación?")) return;
    const { error } = await supabase.from("supplier_evaluations" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const supplierHistory = (sid: string) => ({
    subs: subs.filter(s => s.supplier_id === sid),
    evals: evals.filter(e => e.supplier_id === sid),
    certs: certs.filter(c => c.supplier_id === sid),
  });

  const loadRanking = async () => {
    setRankingLoading(true);
    const { data } = await (supabase as any).rpc("get_top_suppliers", {
      _category: rankingCategory || null, _limit: 20,
    });
    setRanking(data || []);
    setRankingLoading(false);
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Truck className="h-6 w-6" /> Portal de Proveedores</h2>
          <p className="text-sm text-muted-foreground">Gestiona subcontratistas, sus certificaciones y órdenes de subcontrato.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={tab==="suppliers"?"default":"outline"} onClick={() => setTab("suppliers")}><Truck className="h-4 w-4 mr-1"/>Proveedores</Button>
          <Button variant={tab==="certs"?"default":"outline"} onClick={() => setTab("certs")}><ShieldCheck className="h-4 w-4 mr-1"/>Certificaciones</Button>
          <Button variant={tab==="subcontracts"?"default":"outline"} onClick={() => setTab("subcontracts")}><Handshake className="h-4 w-4 mr-1"/>Subcontratos</Button>
          <Button variant={tab==="evaluations"?"default":"outline"} onClick={() => setTab("evaluations")}><Star className="h-4 w-4 mr-1"/>Evaluaciones</Button>
          <Button variant={tab==="ranking"?"default":"outline"} onClick={() => { setTab("ranking"); loadRanking(); }}><Trophy className="h-4 w-4 mr-1"/>Ranking</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Proveedores</p><p className="text-2xl font-bold">{suppliers.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Activos</p><p className="text-2xl font-bold text-green-600">{suppliers.filter(s=>s.status==="active").length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500"/>Cert. por vencer</p><p className="text-2xl font-bold text-amber-600">{expiringCerts.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Subcontratos activos</p><p className="text-2xl font-bold">{subs.filter(s=>["signed","in_progress"].includes(s.status)).length}</p></Card>
      </div>

      {tab === "suppliers" && (
        <>
          <div className="flex gap-2 items-center">
            <Input placeholder="Buscar…" value={q} onChange={(e)=>setQ(e.target.value)} className="max-w-xs"/>
            <Button onClick={newS}><Plus className="h-4 w-4 mr-1"/>Nuevo proveedor</Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr className="text-left">
                  <th className="p-3">Nombre</th><th className="p-3">RUC</th><th className="p-3">Categoría</th>
                  <th className="p-3">Contacto</th><th className="p-3">Estado</th><th className="p-3">Rating</th><th className="p-3 w-1">Acciones</th>
                </tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Cargando…</td></tr> :
                    filteredS.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin proveedores</td></tr> :
                    filteredS.map(s => (
                      <tr key={s.id} className="border-t">
                        <td className="p-3 font-medium">{s.name}<div className="text-xs text-muted-foreground">{s.email}</div></td>
                        <td className="p-3 font-mono text-xs">{s.ruc || "—"}</td>
                        <td className="p-3">{s.category || "—"}</td>
                        <td className="p-3">{s.contact_name || "—"}<div className="text-xs text-muted-foreground">{s.phone}</div></td>
                        <td className="p-3"><Badge variant={s.status==="active"?"default":s.status==="suspended"?"secondary":"destructive"}>{STATUS[s.status]}</Badge></td>
                        <td className="p-3">{s.rating ? `⭐ ${s.rating}` : "—"}</td>
                        <td className="p-3 whitespace-nowrap">
                          <Button size="icon" variant="ghost" title="Historial" onClick={()=>setHistorySupplier(s)}><History className="h-4 w-4"/></Button>
                          <Button size="icon" variant="ghost" title="Evaluar" onClick={()=>newEv(s.id)}><Star className="h-4 w-4"/></Button>
                          <Button size="icon" variant="ghost" title="Nueva certificación" onClick={()=>newC(s.id)}><ShieldCheck className="h-4 w-4"/></Button>
                          <Button size="icon" variant="ghost" title="Editar" onClick={()=>{setEditS(s);setOpenS(true);}}><Pencil className="h-4 w-4"/></Button>
                          <Button size="icon" variant="ghost" title="Eliminar" onClick={()=>delS(s.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "certs" && (
        <>
          <div className="flex justify-end"><Button onClick={()=>newC()}><Plus className="h-4 w-4 mr-1"/>Nueva certificación</Button></div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr className="text-left">
                  <th className="p-3">Proveedor</th><th className="p-3">Tipo</th><th className="p-3">Número</th>
                  <th className="p-3">Emisor</th><th className="p-3">Vence</th><th className="p-3">Archivo</th><th className="p-3 w-1">Acciones</th>
                </tr></thead>
                <tbody>
                  {certs.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin certificaciones</td></tr> :
                    certs.map(c => {
                      const days = c.expires_at ? differenceInDays(parseISO(c.expires_at), new Date()) : null;
                      return (
                        <tr key={c.id} className="border-t">
                          <td className="p-3">{supplierName(c.supplier_id)}</td>
                          <td className="p-3 font-medium">{c.cert_type}</td>
                          <td className="p-3 font-mono text-xs">{c.cert_number || "—"}</td>
                          <td className="p-3">{c.issuer || "—"}</td>
                          <td className="p-3">
                            {c.expires_at ? format(parseISO(c.expires_at), "dd/MM/yyyy", { locale: es }) : "—"}
                            {days !== null && days <= 30 && <Badge variant={days < 0 ? "destructive" : "secondary"} className="ml-2">{days < 0 ? "Vencida" : `${days}d`}</Badge>}
                          </td>
                          <td className="p-3">{c.file_url ? <a href={c.file_url} target="_blank" rel="noreferrer" className="text-primary underline"><FileText className="h-4 w-4 inline"/></a> : "—"}</td>
                          <td className="p-3 whitespace-nowrap">
                            <Button size="icon" variant="ghost" onClick={()=>{setEditC(c);setOpenC(true);}}><Pencil className="h-4 w-4"/></Button>
                            <Button size="icon" variant="ghost" onClick={()=>delC(c.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "subcontracts" && (
        <>
          <div className="flex justify-end"><Button onClick={newSc}><Plus className="h-4 w-4 mr-1"/>Nuevo subcontrato</Button></div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr className="text-left">
                  <th className="p-3">Código</th><th className="p-3">Título</th><th className="p-3">Proveedor</th>
                  <th className="p-3">Monto</th><th className="p-3">Fechas</th><th className="p-3">Estado</th><th className="p-3 w-1">Acciones</th>
                </tr></thead>
                <tbody>
                  {subs.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin subcontratos</td></tr> :
                    subs.map(sc => (
                      <tr key={sc.id} className="border-t">
                        <td className="p-3 font-mono text-xs">{sc.code}</td>
                        <td className="p-3">{sc.title}</td>
                        <td className="p-3">{supplierName(sc.supplier_id)}</td>
                        <td className="p-3">{sc.amount != null ? `${sc.currency} ${Number(sc.amount).toFixed(2)}` : "—"}</td>
                        <td className="p-3 text-xs">{sc.start_date || "—"} → {sc.end_date || "—"}</td>
                        <td className="p-3"><Badge>{SC_STATUS[sc.status]}</Badge></td>
                        <td className="p-3 whitespace-nowrap">
                          <Button size="icon" variant="ghost" onClick={()=>{setEditSc(sc);setOpenSc(true);}}><Pencil className="h-4 w-4"/></Button>
                          <Button size="icon" variant="ghost" onClick={()=>delSc(sc.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "evaluations" && (
        <>
          <div className="flex justify-end"><Button onClick={()=>newEv()}><Plus className="h-4 w-4 mr-1"/>Nueva evaluación</Button></div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr className="text-left">
                  <th className="p-3">Fecha</th><th className="p-3">Proveedor</th><th className="p-3">Proyecto</th>
                  <th className="p-3">Calidad</th><th className="p-3">Puntualidad</th><th className="p-3">Seguridad</th><th className="p-3">Comunicación</th>
                  <th className="p-3">Global</th><th className="p-3">Recontrataría</th><th className="p-3 w-1">Acciones</th>
                </tr></thead>
                <tbody>
                  {evals.length === 0 ? <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">Sin evaluaciones</td></tr> :
                    evals.map(e => (
                      <tr key={e.id} className="border-t">
                        <td className="p-3 text-xs">{format(parseISO(e.evaluated_at), "dd/MM/yyyy", { locale: es })}</td>
                        <td className="p-3 font-medium">{supplierName(e.supplier_id)}</td>
                        <td className="p-3">{(e.project_id && projects.find(p=>p.id===e.project_id)?.title) || e.project_name || (e.subcontract_id ? subs.find(s=>s.id===e.subcontract_id)?.code : "—")}</td>
                        <td className="p-3">{e.quality_score}</td>
                        <td className="p-3">{e.punctuality_score}</td>
                        <td className="p-3">{e.safety_score}</td>
                        <td className="p-3">{e.communication_score}</td>
                        <td className="p-3 font-bold">⭐ {Number(e.overall_score ?? 0).toFixed(2)}</td>
                        <td className="p-3">{e.would_rehire ? <Badge>Sí</Badge> : <Badge variant="destructive">No</Badge>}</td>
                        <td className="p-3 whitespace-nowrap">
                          <Button size="icon" variant="ghost" onClick={()=>{setEditEv(e);setOpenEv(true);}}><Pencil className="h-4 w-4"/></Button>
                          <Button size="icon" variant="ghost" onClick={()=>delEv(e.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "ranking" && (
        <>
          <div className="flex gap-2 items-center flex-wrap">
            <Input
              placeholder="Filtrar por categoría (opcional)"
              value={rankingCategory}
              onChange={(e)=>setRankingCategory(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={loadRanking} disabled={rankingLoading}>
              <Trophy className="h-4 w-4 mr-1"/>Actualizar ranking
            </Button>
            <p className="text-xs text-muted-foreground ml-auto">
              Top proveedores por rating promedio de evaluaciones. Se usa para invitación automática en RFQs.
            </p>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr className="text-left">
                  <th className="p-3 w-12">#</th>
                  <th className="p-3">Proveedor</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Evaluaciones</th>
                  <th className="p-3">Recontrataría</th>
                  <th className="p-3">Última evaluación</th>
                </tr></thead>
                <tbody>
                  {ranking.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">
                      {rankingLoading ? "Cargando…" : "Sin datos. Añade evaluaciones para generar el ranking."}
                    </td></tr>
                  ) : ranking.map((r, i) => (
                    <tr key={r.supplier_id} className="border-t">
                      <td className="p-3 font-bold text-muted-foreground">
                        {i < 3 ? <Trophy className={`h-4 w-4 ${i===0?"text-amber-500":i===1?"text-slate-400":"text-orange-700"}`}/> : i+1}
                      </td>
                      <td className="p-3 font-medium">{r.name}</td>
                      <td className="p-3">{r.category || "—"}</td>
                      <td className="p-3 font-bold">⭐ {Number(r.rating ?? 0).toFixed(2)}</td>
                      <td className="p-3">{r.evaluations_count}</td>
                      <td className="p-3">{Number(r.would_rehire_pct ?? 0).toFixed(0)}%</td>
                      <td className="p-3 text-xs">{r.last_evaluated_at ? format(parseISO(r.last_evaluated_at), "dd/MM/yyyy", { locale: es }) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}


      {/* Supplier Dialog */}
      <Dialog open={openS} onOpenChange={(v)=>{setOpenS(v); if(!v) setEditS(null);}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editS?.id ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle></DialogHeader>
          {editS && (
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Nombre *</Label><Input value={editS.name} onChange={(e)=>setEditS({...editS, name: e.target.value})}/></div>
              <div><Label>RUC</Label><Input value={editS.ruc||""} onChange={(e)=>setEditS({...editS, ruc: e.target.value})}/></div>
              <div><Label>Contacto</Label><Input value={editS.contact_name||""} onChange={(e)=>setEditS({...editS, contact_name: e.target.value})}/></div>
              <div><Label>Email</Label><Input type="email" value={editS.email||""} onChange={(e)=>setEditS({...editS, email: e.target.value})}/></div>
              <div><Label>Teléfono</Label><Input value={editS.phone||""} onChange={(e)=>setEditS({...editS, phone: e.target.value})}/></div>
              <div><Label>Categoría</Label><Input placeholder="p. ej. Excavación, Transporte" value={editS.category||""} onChange={(e)=>setEditS({...editS, category: e.target.value})}/></div>
              <div className="md:col-span-2"><Label>Dirección</Label><Input value={editS.address||""} onChange={(e)=>setEditS({...editS, address: e.target.value})}/></div>
              <div><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" step="0.1" value={editS.rating ?? ""} onChange={(e)=>setEditS({...editS, rating: e.target.value ? Number(e.target.value) : null})}/></div>
              <div><Label>Estado</Label>
                <Select value={editS.status} onValueChange={(v)=>setEditS({...editS, status: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                    <SelectItem value="blacklisted">Lista negra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Notas</Label><Textarea rows={3} value={editS.notes||""} onChange={(e)=>setEditS({...editS, notes: e.target.value})}/></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenS(false)}>Cancelar</Button>
            <Button onClick={saveS}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certification Dialog */}
      <Dialog open={openC} onOpenChange={(v)=>{setOpenC(v); if(!v) setEditC(null);}}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editC?.id ? "Editar certificación" : "Nueva certificación"}</DialogTitle></DialogHeader>
          {editC && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Proveedor *</Label>
                <Select value={editC.supplier_id} onValueChange={(v)=>setEditC({...editC, supplier_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Elegir…"/></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tipo *</Label><Input placeholder="SCTR, ISO 9001, Homologación…" value={editC.cert_type} onChange={(e)=>setEditC({...editC, cert_type: e.target.value})}/></div>
              <div><Label>Número</Label><Input value={editC.cert_number||""} onChange={(e)=>setEditC({...editC, cert_number: e.target.value})}/></div>
              <div><Label>Emisor</Label><Input value={editC.issuer||""} onChange={(e)=>setEditC({...editC, issuer: e.target.value})}/></div>
              <div><Label>URL archivo</Label><Input value={editC.file_url||""} onChange={(e)=>setEditC({...editC, file_url: e.target.value})}/></div>
              <div><Label>Emitida</Label><Input type="date" value={editC.issued_at||""} onChange={(e)=>setEditC({...editC, issued_at: e.target.value})}/></div>
              <div><Label>Vence</Label><Input type="date" value={editC.expires_at||""} onChange={(e)=>setEditC({...editC, expires_at: e.target.value})}/></div>
              <div className="md:col-span-2"><Label>Notas</Label><Textarea rows={2} value={editC.notes||""} onChange={(e)=>setEditC({...editC, notes: e.target.value})}/></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenC(false)}>Cancelar</Button>
            <Button onClick={saveC}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcontract Dialog */}
      <Dialog open={openSc} onOpenChange={(v)=>{setOpenSc(v); if(!v) setEditSc(null);}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editSc?.id ? "Editar subcontrato" : "Nuevo subcontrato"}</DialogTitle></DialogHeader>
          {editSc && (
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Código *</Label><Input value={editSc.code} onChange={(e)=>setEditSc({...editSc, code: e.target.value})}/></div>
              <div><Label>Proveedor *</Label>
                <Select value={editSc.supplier_id} onValueChange={(v)=>setEditSc({...editSc, supplier_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Elegir…"/></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Título *</Label><Input value={editSc.title} onChange={(e)=>setEditSc({...editSc, title: e.target.value})}/></div>
              <div className="md:col-span-2"><Label>Alcance</Label><Textarea rows={3} value={editSc.scope||""} onChange={(e)=>setEditSc({...editSc, scope: e.target.value})}/></div>
              <div><Label>Monto</Label><Input type="number" step="0.01" value={editSc.amount ?? ""} onChange={(e)=>setEditSc({...editSc, amount: e.target.value ? Number(e.target.value) : null})}/></div>
              <div><Label>Moneda</Label>
                <Select value={editSc.currency} onValueChange={(v)=>setEditSc({...editSc, currency: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="PEN">PEN</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Inicio</Label><Input type="date" value={editSc.start_date||""} onChange={(e)=>setEditSc({...editSc, start_date: e.target.value})}/></div>
              <div><Label>Fin</Label><Input type="date" value={editSc.end_date||""} onChange={(e)=>setEditSc({...editSc, end_date: e.target.value})}/></div>
              <div><Label>Estado</Label>
                <Select value={editSc.status} onValueChange={(v)=>setEditSc({...editSc, status: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(SC_STATUS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Condiciones de pago</Label><Textarea rows={2} value={editSc.payment_terms||""} onChange={(e)=>setEditSc({...editSc, payment_terms: e.target.value})}/></div>
              <div className="md:col-span-2"><Label>Notas</Label><Textarea rows={2} value={editSc.notes||""} onChange={(e)=>setEditSc({...editSc, notes: e.target.value})}/></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenSc(false)}>Cancelar</Button>
            <Button onClick={saveSc}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={openEv} onOpenChange={(v)=>{setOpenEv(v); if(!v) setEditEv(null);}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editEv?.id ? "Editar evaluación" : "Nueva evaluación"}</DialogTitle></DialogHeader>
          {editEv && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Proveedor *</Label>
                <Select value={editEv.supplier_id} onValueChange={(v)=>setEditEv({...editEv, supplier_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Elegir…"/></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Subcontrato (opcional)</Label>
                <Select value={editEv.subcontract_id || "none"} onValueChange={(v)=>setEditEv({...editEv, subcontract_id: v==="none"?null:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Ninguno —</SelectItem>
                    {subs.filter(s=>s.supplier_id===editEv.supplier_id).map(s => <SelectItem key={s.id} value={s.id}>{s.code} — {s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Proyecto del portafolio (opcional)</Label>
                <Select value={editEv.project_id || "none"} onValueChange={(v)=>{
                  const pid = v==="none" ? null : v;
                  const pname = pid ? (projects.find(p=>p.id===pid)?.title || editEv.project_name) : editEv.project_name;
                  setEditEv({...editEv, project_id: pid, project_name: pid ? (projects.find(p=>p.id===pid)?.title || "") : editEv.project_name });
                }}>
                  <SelectTrigger><SelectValue placeholder="— Ninguno —"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Ninguno —</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nombre libre del proyecto</Label><Input value={editEv.project_name||""} onChange={(e)=>setEditEv({...editEv, project_name: e.target.value})} placeholder="Si no está en el portafolio"/></div>
              {(["quality_score","punctuality_score","safety_score","communication_score"] as const).map(k => (
                <div key={k}>
                  <Label>{({quality_score:"Calidad",punctuality_score:"Puntualidad",safety_score:"Seguridad",communication_score:"Comunicación"} as any)[k]} (1-5)</Label>
                  <Input type="number" min="1" max="5" value={editEv[k]} onChange={(e)=>setEditEv({...editEv, [k]: Math.min(5, Math.max(1, Number(e.target.value)||1)) })}/>
                </div>
              ))}
              <div><Label>Fecha</Label><Input type="date" value={editEv.evaluated_at} onChange={(e)=>setEditEv({...editEv, evaluated_at: e.target.value})}/></div>
              <div className="flex items-center gap-2 mt-6">
                <input id="rehire" type="checkbox" checked={editEv.would_rehire} onChange={(e)=>setEditEv({...editEv, would_rehire: e.target.checked})}/>
                <Label htmlFor="rehire" className="cursor-pointer">Recontrataría a este proveedor</Label>
              </div>
              <div className="md:col-span-2"><Label>Comentarios</Label><Textarea rows={3} value={editEv.comments||""} onChange={(e)=>setEditEv({...editEv, comments: e.target.value})}/></div>
              <p className="md:col-span-2 text-xs text-muted-foreground">Promedio actual: <strong>{((editEv.quality_score+editEv.punctuality_score+editEv.safety_score+editEv.communication_score)/4).toFixed(2)}</strong>. El rating del proveedor se recalcula automáticamente.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenEv(false)}>Cancelar</Button>
            <Button onClick={saveEv}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier History Dialog */}
      <Dialog open={!!historySupplier} onOpenChange={(v)=>{ if(!v) setHistorySupplier(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Historial — {historySupplier?.name}</DialogTitle></DialogHeader>
          {historySupplier && (() => {
            const h = supplierHistory(historySupplier.id);
            const avg = h.evals.length ? (h.evals.reduce((a,e)=>a+Number(e.overall_score||0),0)/h.evals.length).toFixed(2) : "—";
            const rehirePct = h.evals.length ? Math.round(100*h.evals.filter(e=>e.would_rehire).length/h.evals.length) : 0;
            const totalAmount = h.subs.reduce((a,s)=>a+Number(s.amount||0),0);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Card className="p-3"><p className="text-xs text-muted-foreground">Rating global</p><p className="text-xl font-bold">⭐ {avg}</p></Card>
                  <Card className="p-3"><p className="text-xs text-muted-foreground">Evaluaciones</p><p className="text-xl font-bold">{h.evals.length}</p></Card>
                  <Card className="p-3"><p className="text-xs text-muted-foreground">Recontratación</p><p className="text-xl font-bold">{rehirePct}%</p></Card>
                  <Card className="p-3"><p className="text-xs text-muted-foreground">Total facturado</p><p className="text-xl font-bold">{totalAmount.toFixed(0)}</p></Card>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Subcontratos ({h.subs.length})</p>
                  {h.subs.length === 0 ? <p className="text-sm text-muted-foreground">Sin trabajos previos</p> : (
                    <ul className="text-sm divide-y border rounded">
                      {h.subs.map(s => (
                        <li key={s.id} className="p-2 flex justify-between gap-2">
                          <span><span className="font-mono text-xs">{s.code}</span> — {s.title}</span>
                          <span className="text-xs text-muted-foreground">{s.start_date || "—"} · <Badge variant="outline">{SC_STATUS[s.status]}</Badge></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Evaluaciones ({h.evals.length})</p>
                  {h.evals.length === 0 ? <p className="text-sm text-muted-foreground">Sin evaluaciones</p> : (
                    <ul className="text-sm divide-y border rounded">
                      {h.evals.map(e => (
                        <li key={e.id} className="p-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{(e.project_id && projects.find(p=>p.id===e.project_id)?.title) || e.project_name || "Proyecto"} — ⭐ {Number(e.overall_score||0).toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">{format(parseISO(e.evaluated_at), "dd/MM/yyyy", { locale: es })}</span>
                          </div>
                          {e.comments && <p className="text-xs text-muted-foreground mt-1">{e.comments}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Certificaciones ({h.certs.length})</p>
                  {h.certs.length === 0 ? <p className="text-sm text-muted-foreground">Sin certificaciones</p> : (
                    <ul className="text-sm divide-y border rounded">
                      {h.certs.map(c => (
                        <li key={c.id} className="p-2 flex justify-between">
                          <span>{c.cert_type} {c.cert_number && <span className="text-xs text-muted-foreground">— {c.cert_number}</span>}</span>
                          <span className="text-xs text-muted-foreground">Vence: {c.expires_at || "—"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={()=>{ newEv(historySupplier.id); setHistorySupplier(null); }}><Star className="h-4 w-4 mr-1"/>Nueva evaluación</Button>
                  <Button variant="outline" onClick={()=>setHistorySupplier(null)}>Cerrar</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
