import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

interface ContactInfo {
  id: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  business_hours: string | null;
  google_maps_url: string | null;
}

const AdminContact = () => {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContact();
  }, []);

  const fetchContact = async () => {
    const { data, error } = await supabase
      .from("contact_info")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error fetching contact:", error);
    } else if (data) {
      setContact(data);
    } else {
      setContact({
        id: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        country: "",
        business_hours: "",
        google_maps_url: "",
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!contact) return;
    
    setIsSaving(true);
    
    try {
      if (contact.id) {
        const { error } = await supabase
          .from("contact_info")
          .update({
            phone: contact.phone,
            email: contact.email,
            address: contact.address,
            city: contact.city,
            country: contact.country,
            business_hours: contact.business_hours,
            google_maps_url: contact.google_maps_url,
          })
          .eq("id", contact.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("contact_info")
          .insert({
            phone: contact.phone,
            email: contact.email,
            address: contact.address,
            city: contact.city,
            country: contact.country,
            business_hours: contact.business_hours,
            google_maps_url: contact.google_maps_url,
          })
          .select()
          .single();

        if (error) throw error;
        setContact(data);
      }

      toast({
        title: "Guardado",
        description: "Información de contacto actualizada correctamente.",
      });
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Información de Contacto</h2>
          <p className="text-muted-foreground">Configura los datos de contacto de la empresa</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos de contacto</CardTitle>
            <CardDescription>Teléfono, email y dirección</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={contact?.phone || ""}
                onChange={(e) => setContact(prev => prev ? { ...prev, phone: e.target.value } : null)}
                placeholder="+34 123 456 789"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={contact?.email || ""}
                onChange={(e) => setContact(prev => prev ? { ...prev, email: e.target.value } : null)}
                placeholder="info@aleksey.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Dirección</label>
              <Textarea
                value={contact?.address || ""}
                onChange={(e) => setContact(prev => prev ? { ...prev, address: e.target.value } : null)}
                placeholder="Calle Principal 123"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación y horarios</CardTitle>
            <CardDescription>Ciudad, país y horario de atención</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ciudad</label>
                <Input
                  value={contact?.city || ""}
                  onChange={(e) => setContact(prev => prev ? { ...prev, city: e.target.value } : null)}
                  placeholder="Madrid"
                />
              </div>
              <div>
                <label className="text-sm font-medium">País</label>
                <Input
                  value={contact?.country || ""}
                  onChange={(e) => setContact(prev => prev ? { ...prev, country: e.target.value } : null)}
                  placeholder="España"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Horario de atención</label>
              <Input
                value={contact?.business_hours || ""}
                onChange={(e) => setContact(prev => prev ? { ...prev, business_hours: e.target.value } : null)}
                placeholder="Lun - Vie: 8:00 - 18:00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL de Google Maps (embed)</label>
              <Input
                value={contact?.google_maps_url || ""}
                onChange={(e) => setContact(prev => prev ? { ...prev, google_maps_url: e.target.value } : null)}
                placeholder="https://www.google.com/maps/embed?..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminContact;
