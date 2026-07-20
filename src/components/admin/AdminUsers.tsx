import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, Pencil, Users, Shield, User as UserIcon, KeyRound,
  RefreshCw, Edit3, Eye, Briefcase, HardHat, Truck, Handshake,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Role =
  | "admin" | "manager" | "editor" | "viewer"
  | "operator" | "supplier" | "client" | "user";

const ROLE_META: Record<Role, { label: string; icon: any; description: string; variant: any }> = {
  admin:    { label: "Administrador", icon: Shield,    description: "Acceso total",                     variant: "default"   },
  manager:  { label: "Manager",       icon: Briefcase, description: "Operaciones y equipo",             variant: "default"   },
  editor:   { label: "Editor",        icon: Edit3,     description: "Gestiona contenido del sitio",     variant: "secondary" },
  viewer:   { label: "Visualizador",  icon: Eye,       description: "Solo lectura",                     variant: "outline"   },
  operator: { label: "Operador",      icon: HardHat,   description: "Trabaja en campo (OTs)",           variant: "secondary" },
  supplier: { label: "Proveedor",     icon: Handshake, description: "Portal proveedor (RFQs)",          variant: "outline"   },
  client:   { label: "Cliente",       icon: Truck,     description: "Portal cliente",                   variant: "outline"   },
  user:     { label: "Usuario",       icon: UserIcon,  description: "Sin acceso al panel",              variant: "outline"   },
};

const ROLE_OPTIONS_ADMIN: Role[] = ["user", "client", "supplier", "operator", "viewer", "editor", "manager", "admin"];
const ROLE_OPTIONS_MANAGER: Role[] = ["user", "client", "supplier", "operator", "viewer", "editor"];

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: Role;
  branch_ids: string[];
}

interface BranchOption { id: string; name: string; }

const AdminUsers = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("user");
  const [newBranchIds, setNewBranchIds] = useState<string[]>([]);

  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<Role>("user");
  const [editBranchIds, setEditBranchIds] = useState<string[]>([]);

  const roleOptions = isAdmin ? ROLE_OPTIONS_ADMIN : ROLE_OPTIONS_MANAGER;

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("id, name").order("name");
    setBranches((data ?? []) as BranchOption[]);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "list" } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newEmail || !newPassword) { toast.error("Email y contraseña son requeridos"); return; }
    if (newPassword.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "create", email: newEmail, password: newPassword, role: newRole, branch_ids: newBranchIds },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success("Usuario creado correctamente");
      setCreateDialogOpen(false);
      setNewEmail(""); setNewPassword(""); setNewRole("user"); setNewBranchIds([]);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear usuario");
    }
    setIsSubmitting(false);
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const body: any = { action: "update", userId: selectedUser.id, branch_ids: editBranchIds };
      if (editEmail && editEmail !== selectedUser.email) body.email = editEmail;
      if (editPassword) body.password = editPassword;
      if (editRole !== selectedUser.role) body.role = editRole;
      const { data, error } = await supabase.functions.invoke("manage-users", { body });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success("Usuario actualizado correctamente");
      setEditDialogOpen(false); setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar usuario");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", userId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success("Usuario eliminado correctamente");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar usuario");
    }
  };

  const handleSendReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(`Enlace de recuperación enviado a ${email}`);
  };

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setEditEmail(user.email); setEditPassword("");
    setEditRole(user.role); setEditBranchIds(user.branch_ids ?? []);
    setEditDialogOpen(true);
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("es-PE", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }) : "Nunca";

  const toggleBranch = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const BranchPicker = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void; }) => (
    <div className="space-y-2">
      <Label>Sucursales asignadas</Label>
      {branches.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hay sucursales configuradas. Se aplican permisos globales.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
          {branches.map((b) => (
            <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={value.includes(b.id)}
                onCheckedChange={() => toggleBranch(value, onChange, b.id)}
              />
              {b.name}
            </label>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Vacío = acceso global. Admin siempre ve todas las sucursales.
      </p>
    </div>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" /> Gestión de Usuarios
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Nuevo Usuario</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>El usuario podrá iniciar sesión inmediatamente.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="usuario@ejemplo.com"
                    value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" placeholder="Mínimo 8 caracteres"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => {
                        const m = ROLE_META[r]; const Icon = m.icon;
                        return (
                          <SelectItem key={r} value={r}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{m.label}</span>
                              <span className="text-xs text-muted-foreground">— {m.description}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <BranchPicker value={newBranchIds} onChange={setNewBranchIds} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear Usuario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usuarios Registrados ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay usuarios registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Sucursales</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const m = ROLE_META[u.role] || ROLE_META.user;
                  const Icon = m.icon;
                  const isAdminTarget = u.role === "admin";
                  const canModify = isAdmin || !isAdminTarget;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={m.variant} className="gap-1">
                          <Icon className="h-3 w-3" /> {m.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.branch_ids?.length
                          ? `${u.branch_ids.length} sucursal(es)`
                          : "Todas"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(u.created_at)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(u.last_sign_in_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)}
                            disabled={!canModify}
                            title={canModify ? "Editar" : "Solo un administrador puede editar administradores"}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleSendReset(u.email)}
                            title="Enviar enlace de recuperación de contraseña">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                                disabled={u.id === currentUser?.id || !canModify}
                                title={u.id === currentUser?.id ? "No puedes eliminar tu cuenta" : "Eliminar"}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará permanentemente <strong>{u.email}</strong>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(u.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Deja la contraseña vacía para no cambiarla.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
              <Input id="edit-password" type="password" placeholder="Dejar vacío"
                value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => {
                    const m = ROLE_META[r]; const Icon = m.icon;
                    return (
                      <SelectItem key={r} value={r}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{m.label}</span>
                          <span className="text-xs text-muted-foreground">— {m.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <BranchPicker value={editBranchIds} onChange={setEditBranchIds} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
