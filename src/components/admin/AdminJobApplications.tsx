import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Users, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface JobApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  message: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  contacted: "Contactado",
  accepted: "Aceptado",
  rejected: "Rechazado",
};

const AdminJobApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
    } else {
      setApplications(data || []);
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Actualizado", description: "Estado actualizado correctamente." });
      fetchApplications();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta postulación?")) return;

    try {
      const { error } = await supabase.from("job_applications").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "Postulación eliminada correctamente." });
      fetchApplications();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold">Postulaciones de Empleo</h2>
        <p className="text-muted-foreground">Postulaciones recibidas desde la página de convocatoria</p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay postulaciones aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <Badge className={statusColors[app.status] || "bg-gray-100"}>
                      {statusLabels[app.status] || app.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedApplication(app)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(app.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">{app.email}</span>
                  <span className="text-muted-foreground">{app.phone}</span>
                  <span className="font-medium text-primary">{app.position}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(app.created_at), "PPp", { locale: es })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Postulación de {selectedApplication?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p>{selectedApplication?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                <p>{selectedApplication?.phone}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Posición</label>
              <p className="font-medium text-primary">{selectedApplication?.position}</p>
            </div>
            {selectedApplication?.message && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mensaje</label>
                <p className="whitespace-pre-wrap">{selectedApplication.message}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <Select
                value={selectedApplication?.status || "pending"}
                onValueChange={(value) => {
                  if (selectedApplication) {
                    handleStatusChange(selectedApplication.id, value);
                    setSelectedApplication({ ...selectedApplication, status: value });
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="reviewed">Revisado</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="accepted">Aceptado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha</label>
              <p>{selectedApplication && format(new Date(selectedApplication.created_at), "PPpp", { locale: es })}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobApplications;
