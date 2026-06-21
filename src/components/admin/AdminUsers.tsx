import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, Users, Shield, User, RefreshCw, Edit3, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Role = "admin" | "editor" | "viewer" | "user";

const ROLE_META: Record<Role, { label: string; icon: typeof Shield; description: string; badgeVariant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Administrador", icon: Shield, description: "Acceso total", badgeVariant: "default" },
  editor: { label: "Editor", icon: Edit3, description: "Gestiona contenido del sitio", badgeVariant: "secondary" },
  viewer: { label: "Visualizador", icon: Eye, description: "Solo lectura de mensajes y reservas", badgeVariant: "outline" },
  user: { label: "Usuario", icon: User, description: "Sin acceso al panel", badgeVariant: "outline" },
};

const ROLE_OPTIONS: Role[] = ["user", "viewer", "editor", "admin"];

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: Role;
}

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Form state for create
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("user");

  // Form state for edit
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<Role>("user");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newEmail || !newPassword) {
      toast.error("Email y contraseña son requeridos");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "create",
          email: newEmail,
          password: newPassword,
          role: newRole,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Usuario creado correctamente");
      setCreateDialogOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear usuario");
    }
    setIsSubmitting(false);
  };

  const handleEdit = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const updateData: { userId: string; email?: string; password?: string; role?: string } = {
        userId: selectedUser.id,
      };

      if (editEmail && editEmail !== selectedUser.email) {
        updateData.email = editEmail;
      }
      if (editPassword) {
        updateData.password = editPassword;
      }
      if (editRole !== selectedUser.role) {
        updateData.role = editRole;
      }

      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "update", ...updateData },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Usuario actualizado correctamente");
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
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
      console.error("Error deleting user:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar usuario");
    }
  };

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setEditEmail(user.email);
    setEditPassword("");
    setEditRole(user.role);
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Gestión de Usuarios
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del nuevo usuario. El usuario podrá iniciar sesión inmediatamente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={newRole} onValueChange={(value) => setNewRole(value as Role)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => {
                        const m = ROLE_META[r];
                        const Icon = m.icon;
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
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
                  <TableHead>Creado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {(() => {
                        const m = ROLE_META[user.role] || ROLE_META.user;
                        const Icon = m.icon;
                        return (
                          <Badge variant={m.badgeVariant} className="gap-1">
                            <Icon className="h-3 w-3" />
                            {m.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.last_sign_in_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          title="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={user.id === currentUser?.id}
                              title={user.id === currentUser?.id ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
                                <strong>{user.email}</strong> y todos sus datos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario. Deja la contraseña vacía para mantener la actual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Dejar vacío para mantener"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select value={editRole} onValueChange={(value) => setEditRole(value as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => {
                    const m = ROLE_META[r];
                    const Icon = m.icon;
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
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
