import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Users, Eye, FileText, Download, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AssigneeSelect from "@/components/admin/AssigneeSelect";

interface JobApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  message: string | null;
  status: string;
  resume_url: string | null;
  created_at: string;
  assigned_to?: string | null;
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

  const handleDelete = async (id: string, resumeUrl: string | null) => {
    if (!confirm("¿Estás seguro de eliminar esta postulación?")) return;

    try {
      // Delete resume from storage if exists
      if (resumeUrl) {
        await supabase.storage.from("resumes").remove([resumeUrl]);
      }

      const { error } = await supabase.from("job_applications").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "Postulación eliminada correctamente." });
      fetchApplications();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleDownloadResume = async (resumeUrl: string, applicantName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .download(resumeUrl);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV-${applicantName.replace(/\s+/g, "-")}.${resumeUrl.split(".").pop()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast({ title: "Error", description: "No se pudo descargar el CV.", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    if (applications.length === 0) {
      toast({ title: "Sin datos", description: "No hay postulaciones para exportar.", variant: "destructive" });
      return;
    }

    // CSV headers
    const headers = ["Nombre", "Email", "Teléfono", "Posición", "Estado", "Mensaje", "Tiene CV", "Fecha"];
    
    // CSV rows
    const rows = applications.map((app) => [
      `"${app.name.replace(/"/g, '""')}"`,
      `"${app.email}"`,
      `"${app.phone}"`,
      `"${app.position.replace(/"/g, '""')}"`,
      `"${statusLabels[app.status] || app.status}"`,
      `"${(app.message || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      app.resume_url ? "Sí" : "No",
      `"${format(new Date(app.created_at), "dd/MM/yyyy HH:mm", { locale: es })}"`,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Add BOM for Excel compatibility with UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `postulaciones-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Exportado", description: `Se exportaron ${applications.length} postulaciones.` });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Postulaciones de Empleo</h2>
          <p className="text-muted-foreground">Postulaciones recibidas desde la página de convocatoria</p>
        </div>
        {applications.length > 0 && (
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar CSV
          </Button>
        )}
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
                    {app.resume_url && (
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        CV
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {app.resume_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadResume(app.resume_url!, app.name)}
                        title="Descargar CV"
                      >
                        <Download className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedApplication(app)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(app.id, app.resume_url)}>
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
            {selectedApplication?.resume_url && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Currículum</label>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 gap-2"
                  onClick={() => handleDownloadResume(selectedApplication.resume_url!, selectedApplication.name)}
                >
                  <Download className="h-4 w-4" />
                  Descargar CV
                </Button>
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
              <label className="text-sm font-medium text-muted-foreground">Asignado a</label>
              {selectedApplication && (
                <div className="mt-1">
                  <AssigneeSelect
                    table="job_applications"
                    rowId={selectedApplication.id}
                    value={selectedApplication.assigned_to || null}
                    onChange={(v) => setSelectedApplication({ ...selectedApplication, assigned_to: v })}
                  />
                </div>
              )}
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
