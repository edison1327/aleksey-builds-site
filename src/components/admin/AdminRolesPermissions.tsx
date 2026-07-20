import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Save, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Role =
  | "admin" | "manager" | "editor" | "viewer"
  | "operator" | "supplier" | "client";

interface Row {
  id?: string;
  role: Role;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  scope: string;
}

const ROLES: { key: Role; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "manager", label: "Manager" },
  { key: "editor", label: "Editor" },
  { key: "viewer", label: "Viewer" },
  { key: "operator", label: "Operador" },
  { key: "supplier", label: "Proveedor" },
  { key: "client", label: "Cliente" },
];

const MODULES: { key: string; label: string; group: string }[] = [
  { key: "contenido_cms",     label: "Contenido CMS",       group: "Contenido" },
  { key: "usuarios",          label: "Usuarios",            group: "Administración" },
  { key: "sucursales",        label: "Sucursales",          group: "Administración" },
  { key: "reportes",          label: "Reportes / BI",       group: "Administración" },
  { key: "work_orders",       label: "Órdenes de trabajo",  group: "Operaciones" },
  { key: "inspecciones",      label: "Inspecciones",        group: "Operaciones" },
  { key: "compras",           label: "Compras",             group: "Operaciones" },
  { key: "rfqs",              label: "RFQs (Cotizaciones)", group: "Operaciones" },
  { key: "proveedores",       label: "Proveedores",         group: "Operaciones" },
  { key: "documentos",        label: "Documentos",          group: "Operaciones" },
  { key: "facturas",          label: "Facturación",         group: "Comercial" },
  { key: "contratos",         label: "Contratos",           group: "Comercial" },
  { key: "rrhh",              label: "RRHH & Nómina",       group: "RRHH" },
  { key: "portal_cliente",    label: "Portal cliente",      group: "Portales" },
  { key: "portal_proveedor",  label: "Portal proveedor",    group: "Portales" },
];

const ACTIONS: { key: keyof Row; label: string }[] = [
  { key: "can_view",    label: "Ver" },
  { key: "can_create",  label: "Crear" },
  { key: "can_edit",    label: "Editar" },
  { key: "can_delete",  label: "Eliminar" },
  { key: "can_approve", label: "Aprobar" },
];

const AdminRolesPermissions = () => {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role>("manager");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("role_permissions").select("*");
    if (error) toast.error("Error cargando permisos");
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const rowFor = (r: Role, m: string): Row =>
    rows.find((x) => x.role === r && x.module === m) ?? {
      role: r, module: m, can_view: false, can_create: false, can_edit: false,
      can_delete: false, can_approve: false, scope: "all",
    };

  const toggle = (r: Role, m: string, key: keyof Row) => {
    if (!isAdmin) return;
    if (r === "admin") { toast.info("El rol admin siempre tiene acceso completo."); return; }
    setRows((prev) => {
      const existing = prev.find((x) => x.role === r && x.module === m);
      if (existing) {
        return prev.map((x) => x === existing ? { ...x, [key]: !x[key as keyof Row] } as Row : x);
      }
      const created: Row = { role: r, module: m, can_view: false, can_create: false, can_edit: false, can_delete: false, can_approve: false, scope: "all" };
      (created as any)[key] = true;
      return [...prev, created];
    });
  };

  const save = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      // upsert all
      const payload = rows.map(({ id, ...rest }) => rest);
      const { error } = await supabase
        .from("role_permissions")
        .upsert(payload as any, { onConflict: "role,module" });
      if (error) throw error;
      toast.success("Permisos guardados");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const groups = Array.from(new Set(MODULES.map((m) => m.group)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Roles y Permisos
          </h2>
          <p className="text-sm text-muted-foreground">
            Matriz configurable de permisos por rol y módulo. Solo administradores pueden editar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2" /> Recargar</Button>
          <Button onClick={save} disabled={saving || !isAdmin}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" /> Guardar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Selecciona un rol</CardTitle>
          <CardDescription>Configura permisos rol por rol. El rol admin siempre tiene acceso completo (no editable).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {ROLES.map((r) => (
              <Button
                key={r.key}
                variant={role === r.key ? "default" : "outline"}
                size="sm"
                onClick={() => setRole(r.key)}
              >
                {r.label}
                {r.key === "admin" && <Badge variant="secondary" className="ml-2 text-xs">bloqueado</Badge>}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {groups.map((g) => (
        <Card key={g}>
          <CardHeader>
            <CardTitle className="text-base">{g}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  {ACTIONS.map((a) => (
                    <TableHead key={a.key as string} className="text-center">{a.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODULES.filter((m) => m.group === g).map((m) => {
                  const row = rowFor(role, m.key);
                  const disabled = role === "admin" || !isAdmin;
                  return (
                    <TableRow key={m.key}>
                      <TableCell className="font-medium">{m.label}</TableCell>
                      {ACTIONS.map((a) => (
                        <TableCell key={a.key as string} className="text-center">
                          <Checkbox
                            checked={role === "admin" ? true : Boolean(row[a.key])}
                            disabled={disabled}
                            onCheckedChange={() => toggle(role, m.key, a.key)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminRolesPermissions;
