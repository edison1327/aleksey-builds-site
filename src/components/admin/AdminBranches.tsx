import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Building2, Plus, Trash2, Users, TrendingUp } from "lucide-react";
import { useBranch } from "@/hooks/useBranch";

type Org = { id: string; name: string; legal_name: string | null; tax_id: string | null; country: string; currency: string; is_active: boolean };
type Branch = { id: string; organization_id: string; code: string; name: string; address: string | null; city: string | null; phone: string | null; is_active: boolean };
type Membership = { id: string; user_id: string; branch_id: string; role_in_branch: string; is_primary: boolean };
type PnLRow = { organization_id: string; organization_name: string; branch_id: string; branch_name: string; invoiced: number; paid: number; purchase_cost: number; labor_cost: number; net: number };

const money = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export default function AdminBranches() {
  const { refresh } = useBranch();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);
  const [pnl, setPnl] = useState<PnLRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [orgOpen, setOrgOpen] = useState(false);
  const [orgForm, setOrgForm] = useState<Partial<Org>>({ country: "CO", currency: "COP", is_active: true });

  const [branchOpen, setBranchOpen] = useState(false);
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({ is_active: true });

  const [memberOpen, setMemberOpen] = useState(false);
  const [memberForm, setMemberForm] = useState<{ user_email: string; branch_id: string; role_in_branch: string }>({
    user_email: "", branch_id: "", role_in_branch: "member",
  });

  const load = async () => {
    setLoading(true);
    const [o, b, m, p] = await Promise.all([
      supabase.from("organizations").select("*").order("name"),
      supabase.from("branches").select("*").order("name"),
      supabase.from("user_branches").select("*"),
      supabase.rpc("get_consolidated_pnl"),
    ]);
    setOrgs((o.data as Org[]) || []);
    setBranches((b.data as Branch[]) || []);
    setMembers((m.data as Membership[]) || []);
    setPnl((p.data as PnLRow[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveOrg = async () => {
    if (!orgForm.name) return toast.error("Nombre requerido");
    const { error } = await supabase.from("organizations").insert(orgForm as any);
    if (error) return toast.error(error.message);
    toast.success("Empresa creada");
    setOrgOpen(false); setOrgForm({ country: "CO", currency: "COP", is_active: true });
    load();
  };

  const saveBranch = async () => {
    if (!branchForm.organization_id || !branchForm.name || !branchForm.code)
      return toast.error("Empresa, código y nombre requeridos");
    const { error } = await supabase.from("branches").insert(branchForm as any);
    if (error) return toast.error(error.message);
    toast.success("Sucursal creada");
    setBranchOpen(false); setBranchForm({ is_active: true });
    load(); refresh();
  };

  const removeBranch = async (id: string) => {
    if (!confirm("¿Eliminar sucursal? Los registros seguirán existiendo sin sucursal asignada.")) return;
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Sucursal eliminada");
    load(); refresh();
  };

  const toggleActive = async (b: Branch) => {
    await supabase.from("branches").update({ is_active: !b.is_active }).eq("id", b.id);
    load(); refresh();
  };

  const assignMember = async () => {
    if (!memberForm.user_email || !memberForm.branch_id) return toast.error("Email y sucursal requeridos");
    // Lookup by email via profiles (or user_roles user_id resolution). Use auth admin lookup via RPC not available;
    // ask user to enter user UUID as fallback if not found.
    const { data: prof } = await supabase.from("contact_messages").select("id").limit(0); // no-op keeps types happy
    void prof;
    // Try to find via a profiles table if exists — otherwise treat input as UUID directly.
    let uid: string | null = null;
    if (/^[0-9a-f-]{36}$/i.test(memberForm.user_email)) {
      uid = memberForm.user_email;
    } else {
      const { data } = await supabase.from("employees").select("user_id, email").eq("email", memberForm.user_email).maybeSingle();
      uid = (data as any)?.user_id || null;
    }
    if (!uid) return toast.error("Usuario no encontrado. Ingresa su UUID o crea un empleado con ese email.");
    const { error } = await supabase.from("user_branches").insert({
      user_id: uid, branch_id: memberForm.branch_id, role_in_branch: memberForm.role_in_branch,
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Usuario asignado a la sucursal");
    setMemberOpen(false); setMemberForm({ user_email: "", branch_id: "", role_in_branch: "member" });
    load();
  };

  const removeMember = async (id: string) => {
    await supabase.from("user_branches").delete().eq("id", id);
    load();
  };

  const totals = pnl.reduce(
    (a, r) => ({
      invoiced: a.invoiced + Number(r.invoiced || 0),
      paid: a.paid + Number(r.paid || 0),
      purchase_cost: a.purchase_cost + Number(r.purchase_cost || 0),
      labor_cost: a.labor_cost + Number(r.labor_cost || 0),
      net: a.net + Number(r.net || 0),
    }),
    { invoiced: 0, paid: 0, purchase_cost: 0, labor_cost: 0, net: 0 }
  );

  if (loading) return <div className="p-6 text-muted-foreground">Cargando…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Multi-sucursal / Multi-empresa</h2>
          <p className="text-sm text-muted-foreground">Gestiona empresas, sucursales y su equipo. Consulta P&L consolidado.</p>
        </div>
      </div>

      <Tabs defaultValue="branches">
        <TabsList>
          <TabsTrigger value="branches">Sucursales</TabsTrigger>
          <TabsTrigger value="orgs">Empresas</TabsTrigger>
          <TabsTrigger value="members">Equipo por sucursal</TabsTrigger>
          <TabsTrigger value="consolidated">P&L consolidado</TabsTrigger>
        </TabsList>

        {/* Branches */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setBranchOpen(true)} disabled={orgs.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Nueva sucursal
            </Button>
          </div>
          {orgs.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Crea primero una empresa en la pestaña "Empresas".</CardContent></Card>
          )}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((b) => {
                    const org = orgs.find((o) => o.id === b.organization_id);
                    return (
                      <TableRow key={b.id}>
                        <TableCell>{org?.name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{b.code}</TableCell>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.city || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={b.is_active ? "default" : "secondary"} className="cursor-pointer" onClick={() => toggleActive(b)}>
                            {b.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => removeBranch(b.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {branches.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin sucursales</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations */}
        <TabsContent value="orgs" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setOrgOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nueva empresa</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {orgs.map((o) => (
              <Card key={o.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    {o.name}
                    <Badge variant={o.is_active ? "default" : "secondary"}>{o.is_active ? "Activa" : "Inactiva"}</Badge>
                  </CardTitle>
                  <CardDescription>{o.legal_name || o.name}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div><span className="text-muted-foreground">NIT:</span> {o.tax_id || "—"}</div>
                  <div><span className="text-muted-foreground">País:</span> {o.country} · {o.currency}</div>
                  <div><span className="text-muted-foreground">Sucursales:</span> {branches.filter(b => b.organization_id === o.id).length}</div>
                </CardContent>
              </Card>
            ))}
            {orgs.length === 0 && <div className="text-muted-foreground text-sm">Sin empresas</div>}
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setMemberOpen(true)} disabled={branches.length === 0}>
              <Users className="h-4 w-4 mr-1" /> Asignar usuario
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Usuario (UUID)</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const b = branches.find((x) => x.id === m.branch_id);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{b?.name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{m.user_id}</TableCell>
                        <TableCell><Badge variant="outline">{m.role_in_branch}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => removeMember(m.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {members.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin asignaciones</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consolidated P&L */}
        <TabsContent value="consolidated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" /> P&L consolidado (últimos 12 meses)</CardTitle>
              <CardDescription>Ingresos, costos y margen neto por sucursal.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead className="text-right">Facturado</TableHead>
                    <TableHead className="text-right">Cobrado</TableHead>
                    <TableHead className="text-right">Compras</TableHead>
                    <TableHead className="text-right">Nómina</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pnl.map((r) => (
                    <TableRow key={r.branch_id}>
                      <TableCell>{r.organization_name}</TableCell>
                      <TableCell className="font-medium">{r.branch_name}</TableCell>
                      <TableCell className="text-right">{money(r.invoiced)}</TableCell>
                      <TableCell className="text-right">{money(r.paid)}</TableCell>
                      <TableCell className="text-right">{money(r.purchase_cost)}</TableCell>
                      <TableCell className="text-right">{money(r.labor_cost)}</TableCell>
                      <TableCell className={`text-right font-semibold ${r.net >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {money(r.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pnl.length > 0 && (
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell colSpan={2}>Total consolidado</TableCell>
                      <TableCell className="text-right">{money(totals.invoiced)}</TableCell>
                      <TableCell className="text-right">{money(totals.paid)}</TableCell>
                      <TableCell className="text-right">{money(totals.purchase_cost)}</TableCell>
                      <TableCell className="text-right">{money(totals.labor_cost)}</TableCell>
                      <TableCell className={`text-right ${totals.net >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {money(totals.net)}
                      </TableCell>
                    </TableRow>
                  )}
                  {pnl.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin datos aún</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Org dialog */}
      <Dialog open={orgOpen} onOpenChange={setOrgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva empresa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre comercial *</Label><Input value={orgForm.name || ""} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} /></div>
            <div><Label>Razón social</Label><Input value={orgForm.legal_name || ""} onChange={(e) => setOrgForm({ ...orgForm, legal_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>NIT / Tax ID</Label><Input value={orgForm.tax_id || ""} onChange={(e) => setOrgForm({ ...orgForm, tax_id: e.target.value })} /></div>
              <div><Label>País</Label><Input value={orgForm.country || ""} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} /></div>
            </div>
            <div><Label>Moneda</Label><Input value={orgForm.currency || ""} onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOrgOpen(false)}>Cancelar</Button><Button onClick={saveOrg}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branch dialog */}
      <Dialog open={branchOpen} onOpenChange={setBranchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva sucursal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Empresa *</Label>
              <Select value={branchForm.organization_id} onValueChange={(v) => setBranchForm({ ...branchForm, organization_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona empresa" /></SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código *</Label><Input value={branchForm.code || ""} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })} placeholder="BOG-01" /></div>
              <div><Label>Nombre *</Label><Input value={branchForm.name || ""} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} /></div>
            </div>
            <div><Label>Dirección</Label><Input value={branchForm.address || ""} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ciudad</Label><Input value={branchForm.city || ""} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={branchForm.phone || ""} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBranchOpen(false)}>Cancelar</Button><Button onClick={saveBranch}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member dialog */}
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Asignar usuario a sucursal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Sucursal *</Label>
              <Select value={memberForm.branch_id} onValueChange={(v) => setMemberForm({ ...memberForm, branch_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona sucursal" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Usuario (UUID o email de empleado) *</Label>
              <Input value={memberForm.user_email} onChange={(e) => setMemberForm({ ...memberForm, user_email: e.target.value })} placeholder="UUID o email registrado en empleados" />
              <p className="text-xs text-muted-foreground mt-1">Si el email no está en <em>empleados</em>, ingresa el UUID del usuario.</p>
            </div>
            <div>
              <Label>Rol en la sucursal</Label>
              <Select value={memberForm.role_in_branch} onValueChange={(v) => setMemberForm({ ...memberForm, role_in_branch: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="member">Miembro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMemberOpen(false)}>Cancelar</Button><Button onClick={assignMember}>Asignar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
