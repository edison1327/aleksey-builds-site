import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Send, Truck, Car, CheckCircle, Clock, FileDown, Wallet } from "lucide-react";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { downloadQuotePdf } from "@/lib/quotePdf";
import { useAuth } from "@/hooks/useAuth";
import BookingCalendarView from "@/components/BookingCalendarView";

const quoteSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
  email: z.string().trim().email("Email inválido").max(255, "El email es muy largo"),
  phone: z.string().trim().min(1, "El teléfono es requerido").max(20, "El teléfono es muy largo"),
  company: z.string().trim().min(1, "La empresa es requerida").max(100, "El nombre de empresa es muy largo"),
  projectLocation: z.string().trim().min(1, "La ubicación del proyecto es requerida").max(200, "La ubicación es muy larga"),
  message: z.string().trim().min(1, "El mensaje es requerido").max(1000, "El mensaje es muy largo"),
});

interface Equipment {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  image_url: string | null;
  daily_rate: number | null;
}

const QuotePage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedType = searchParams.get("tipo") as "maquinaria" | "vehiculo" | null;
  const preselectedId = searchParams.get("id");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [equipmentType, setEquipmentType] = useState<"maquinaria" | "vehiculo">(preselectedType || "maquinaria");
  const [machinery, setMachinery] = useState<Equipment[]>([]);
  const [vehicles, setVehicles] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>(preselectedId || "");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [rentalPeriod, setRentalPeriod] = useState<"dia" | "semana" | "mes">("dia");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    projectLocation: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Real-time field validation
  const validateField = (field: string, value: string) => {
    const fieldSchema = {
      name: z.string().trim().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
      email: z.string().trim().email("Email inválido").max(255, "El email es muy largo"),
      phone: z.string().trim().min(1, "El teléfono es requerido").max(20, "El teléfono es muy largo"),
      company: z.string().trim().min(1, "La empresa es requerida").max(100, "El nombre de empresa es muy largo"),
      projectLocation: z.string().trim().min(1, "La ubicación del proyecto es requerida").max(200, "La ubicación es muy larga"),
      message: z.string().trim().min(1, "El mensaje es requerido").max(1000, "El mensaje es muy largo"),
    };

    const schema = fieldSchema[field as keyof typeof fieldSchema];
    if (!schema) return;

    const result = schema.safeParse(value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (!result.success) {
        newErrors[field] = result.error.errors[0]?.message || "Campo inválido";
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    const [machineryRes, vehiclesRes] = await Promise.all([
      supabase.from("machinery").select("id, name, brand, model, category, image_url, daily_rate").eq("is_active", true).eq("is_available", true).order("name"),
      supabase.from("vehicles").select("id, name, brand, model, category, image_url, daily_rate").eq("is_active", true).eq("is_available", true).order("name"),
    ]);

    if (machineryRes.data) setMachinery(machineryRes.data);
    if (vehiclesRes.data) setVehicles(vehiclesRes.data);
  };

  const currentEquipmentList = equipmentType === "maquinaria" ? machinery : vehicles;
  const selectedItem = currentEquipmentList.find(e => e.id === selectedEquipment);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    return Math.max(1, differenceInDays(endDate, startDate) + 1);
  };

  /** Discount tiers: 1-6 días 0%, 7-29 días 10%, 30+ días 20% */
  const estimatePrice = () => {
    if (!selectedItem?.daily_rate || !startDate || !endDate) return null;
    const days = calculateDays();
    const rate = Number(selectedItem.daily_rate);
    if (!rate) return null;
    const subtotal = rate * days;
    const discountPct = days >= 30 ? 0.20 : days >= 7 ? 0.10 : 0;
    const discount = subtotal * discountPct;
    const total = subtotal - discount;
    return { rate, days, subtotal, discountPct, discount, total };
  };

  const formatPEN = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 2 }).format(n);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate required fields
    if (!selectedEquipment) {
      setErrors({ equipment: "Selecciona un equipo" });
      return;
    }
    if (!startDate) {
      setErrors({ startDate: "Selecciona fecha de inicio" });
      return;
    }
    if (!endDate) {
      setErrors({ endDate: "Selecciona fecha de fin" });
      return;
    }

    const result = quoteSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const days = calculateDays();
      const equipmentName = selectedItem ? `${selectedItem.name}${selectedItem.brand ? ` - ${selectedItem.brand}` : ""}${selectedItem.model ? ` ${selectedItem.model}` : ""}` : "";
      
      const quoteType = equipmentType === "maquinaria" ? "Maquinaria" : "Vehículo";
      const fullMessage = `[Cotización de ${quoteType}: ${equipmentName}]

Tipo: ${quoteType}
Equipo: ${equipmentName}
Categoría: ${selectedItem?.category || "N/A"}

Período de alquiler:
- Fecha inicio: ${format(startDate!, "PPP", { locale: es })}
- Fecha fin: ${format(endDate!, "PPP", { locale: es })}
- Duración: ${days} día${days > 1 ? "s" : ""}
- Tipo de período: ${rentalPeriod === "dia" ? "Por día" : rentalPeriod === "semana" ? "Por semana" : "Por mes"}

Datos del cliente:
- Empresa: ${formData.company || "N/A"}
- Ubicación del proyecto: ${formData.projectLocation || "N/A"}

Mensaje adicional:
${formData.message || "Sin mensaje adicional"}${(() => {
  const est = estimatePrice();
  return est
    ? `\n\nEstimación referencial:\n- Tarifa diaria: ${formatPEN(est.rate)}\n- Subtotal (${est.days} días): ${formatPEN(est.subtotal)}\n- Descuento: ${(est.discountPct * 100).toFixed(0)}%\n- Total estimado: ${formatPEN(est.total)}`
    : "";
})()}`;

      const { error } = await supabase.from("contact_messages").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: fullMessage,
        user_id: user?.id ?? null,
      });

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke("send-quote-notification", {
          body: {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            message: fullMessage,
            itemName: equipmentName,
            itemType: equipmentType,
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      setIsSuccess(true);
      
      toast({
        title: "¡Solicitud enviada!",
        description: "Nos pondremos en contacto contigo pronto con la cotización.",
      });
    } catch (error) {
      console.error("Error submitting quote:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto text-center border-none shadow-xl">
              <CardContent className="py-16">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-heading font-bold mb-4">¡Solicitud Enviada!</h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Hemos recibido tu solicitud de cotización. Nuestro equipo la revisará y te contactará 
                  en las próximas 24 horas hábiles con una propuesta personalizada.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
                  <Button
                    onClick={() => {
                      const days = calculateDays();
                      const equipmentName = selectedItem
                        ? `${selectedItem.name}${selectedItem.brand ? ` - ${selectedItem.brand}` : ""}${selectedItem.model ? ` ${selectedItem.model}` : ""}`
                        : "";
                      downloadQuotePdf(
                        {
                          date: new Date(),
                          title: `Solicitud de ${equipmentType === "maquinaria" ? "Maquinaria" : "Vehículo"}`,
                          customer: {
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone,
                            company: formData.company,
                            location: formData.projectLocation,
                          },
                          details: [
                            { label: "Equipo", value: equipmentName },
                            { label: "Categoría", value: selectedItem?.category || "—" },
                            { label: "Fecha inicio", value: startDate ? format(startDate, "PPP", { locale: es }) : "—" },
                            { label: "Fecha fin", value: endDate ? format(endDate, "PPP", { locale: es }) : "—" },
                            { label: "Duración", value: `${days} día${days > 1 ? "s" : ""}` },
                            { label: "Período", value: rentalPeriod === "dia" ? "Por día" : rentalPeriod === "semana" ? "Por semana" : "Por mes" },
                          ],
                          message: formData.message,
                        },
                        `mi-solicitud-${equipmentType}.pdf`,
                      );
                    }}
                  >
                    <FileDown className="h-4 w-4 mr-2" /> Descargar PDF
                  </Button>
                  <Button onClick={() => setIsSuccess(false)} variant="outline">
                    Nueva Cotización
                  </Button>
                  <Button onClick={() => window.location.href = "/"} variant="outline">
                    Volver al Inicio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-secondary-foreground">
              Cotizador de Alquiler
            </h1>
            <p className="text-lg text-secondary-foreground/80">
              Completa el formulario y te enviaremos una cotización personalizada para el alquiler de maquinaria o vehículos.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <form id="quote-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Equipment Selection */}
              <div className="lg:col-span-2 space-y-6">
                {/* Equipment Type */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                      Tipo de Equipo
                    </CardTitle>
                    <CardDescription>Selecciona si necesitas maquinaria pesada o vehículos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={equipmentType}
                      onValueChange={(value) => {
                        setEquipmentType(value as "maquinaria" | "vehiculo");
                        setSelectedEquipment("");
                      }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="maquinaria"
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          equipmentType === "maquinaria" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value="maquinaria" id="maquinaria" className="sr-only" />
                        <Truck className={cn("h-8 w-8", equipmentType === "maquinaria" ? "text-primary" : "text-muted-foreground")} />
                        <div>
                          <p className="font-semibold">Maquinaria</p>
                          <p className="text-xs text-muted-foreground">Excavadoras, cargadores, etc.</p>
                        </div>
                      </Label>
                      <Label
                        htmlFor="vehiculo"
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          equipmentType === "vehiculo" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value="vehiculo" id="vehiculo" className="sr-only" />
                        <Car className={cn("h-8 w-8", equipmentType === "vehiculo" ? "text-primary" : "text-muted-foreground")} />
                        <div>
                          <p className="font-semibold">Vehículos</p>
                          <p className="text-xs text-muted-foreground">Camionetas, camiones, etc.</p>
                        </div>
                      </Label>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Equipment Selection */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                      Selecciona el Equipo
                    </CardTitle>
                    <CardDescription>Elige el equipo que necesitas alquilar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                      <SelectTrigger className={errors.equipment ? "border-destructive" : ""}>
                        <SelectValue placeholder={`Selecciona ${equipmentType === "maquinaria" ? "maquinaria" : "vehículo"}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {currentEquipmentList.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} {item.brand && `- ${item.brand}`} {item.model && item.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.equipment && <p className="text-xs text-destructive mt-2">{errors.equipment}</p>}

                    {selectedItem && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-xl flex items-center gap-4">
                        {selectedItem.image_url ? (
                          <img src={selectedItem.image_url} alt={selectedItem.name} className="w-20 h-20 object-cover rounded-lg" />
                        ) : (
                          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                            {equipmentType === "maquinaria" ? <Truck className="h-8 w-8 text-muted-foreground" /> : <Car className="h-8 w-8 text-muted-foreground" />}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{selectedItem.name}</p>
                          {selectedItem.brand && <p className="text-sm text-muted-foreground">{selectedItem.brand} {selectedItem.model}</p>}
                          {selectedItem.category && <p className="text-xs text-primary">{selectedItem.category}</p>}
                        </div>
                      </div>
                    )}

                    {selectedItem && (
                      <div className="mt-4">
                        <BookingCalendarView
                          equipmentType={equipmentType === "maquinaria" ? "machinery" : "vehicle"}
                          equipmentId={selectedItem.id}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Rental Period */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                      Período de Alquiler
                    </CardTitle>
                    <CardDescription>Indica las fechas y tipo de alquiler</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fecha de inicio *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground",
                                errors.startDate && "border-destructive"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Fecha de fin *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground",
                                errors.endDate && "border-destructive"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              disabled={(date) => date < (startDate || new Date())}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de período</Label>
                      <RadioGroup
                        value={rentalPeriod}
                        onValueChange={(value) => setRentalPeriod(value as "dia" | "semana" | "mes")}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="dia" id="dia" />
                          <Label htmlFor="dia" className="cursor-pointer">Por día</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="semana" id="semana" />
                          <Label htmlFor="semana" className="cursor-pointer">Por semana</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mes" id="mes" />
                          <Label htmlFor="mes" className="cursor-pointer">Por mes</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {startDate && endDate && (
                      <div className="p-4 bg-primary/5 rounded-xl flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <p className="text-sm">
                          <span className="font-semibold">{calculateDays()} día{calculateDays() > 1 ? "s" : ""}</span> de alquiler
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
                      Datos de Contacto
                    </CardTitle>
                    <CardDescription>Información para enviarte la cotización</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre completo *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleFieldChange("name", e.target.value)}
                          onBlur={(e) => handleFieldBlur("name", e.target.value)}
                          placeholder="Tu nombre"
                          className={errors.name && touched.name ? "border-destructive" : ""}
                        />
                        {errors.name && touched.name && <p className="text-xs text-destructive">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa *</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => handleFieldChange("company", e.target.value)}
                          onBlur={(e) => handleFieldBlur("company", e.target.value)}
                          placeholder="Nombre de tu empresa"
                          className={errors.company && touched.company ? "border-destructive" : ""}
                        />
                        {errors.company && touched.company && <p className="text-xs text-destructive">{errors.company}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFieldChange("email", e.target.value)}
                          onBlur={(e) => handleFieldBlur("email", e.target.value)}
                          placeholder="tu@email.com"
                          className={errors.email && touched.email ? "border-destructive" : ""}
                        />
                        {errors.email && touched.email && <p className="text-xs text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleFieldChange("phone", e.target.value)}
                          onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                          placeholder="+51 999 999 999"
                          className={errors.phone && touched.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && touched.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectLocation">Ubicación del proyecto *</Label>
                      <Input
                        id="projectLocation"
                        value={formData.projectLocation}
                        onChange={(e) => handleFieldChange("projectLocation", e.target.value)}
                        onBlur={(e) => handleFieldBlur("projectLocation", e.target.value)}
                        placeholder="Ciudad o dirección del proyecto"
                        className={errors.projectLocation && touched.projectLocation ? "border-destructive" : ""}
                      />
                      {errors.projectLocation && touched.projectLocation && <p className="text-xs text-destructive">{errors.projectLocation}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleFieldChange("message", e.target.value)}
                        onBlur={(e) => handleFieldBlur("message", e.target.value)}
                        placeholder="Cuéntanos más sobre tu proyecto o necesidades especiales..."
                        rows={4}
                        className={errors.message && touched.message ? "border-destructive" : ""}
                      />
                      {errors.message && touched.message && <p className="text-xs text-destructive">{errors.message}</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardHeader>
                      <CardTitle>Resumen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="font-medium">{equipmentType === "maquinaria" ? "Maquinaria" : "Vehículo"}</span>
                        </div>
                        
                        {selectedItem && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Equipo:</span>
                            <span className="font-medium text-right max-w-[150px] truncate">{selectedItem.name}</span>
                          </div>
                        )}

                        {startDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Inicio:</span>
                            <span className="font-medium">{format(startDate, "dd/MM/yyyy")}</span>
                          </div>
                        )}

                        {endDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Fin:</span>
                            <span className="font-medium">{format(endDate, "dd/MM/yyyy")}</span>
                          </div>
                        )}

                        {startDate && endDate && (
                          <>
                            <div className="border-t border-border pt-3 flex justify-between">
                              <span className="text-muted-foreground">Duración:</span>
                              <span className="font-bold text-primary">{calculateDays()} día{calculateDays() > 1 ? "s" : ""}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {(() => {
                        const est = estimatePrice();
                        if (!est) return null;
                        return (
                          <div className="rounded-xl border bg-card p-4 space-y-2 animate-fade-in">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <Wallet className="h-4 w-4 text-primary" />
                              Estimación referencial
                            </div>
                            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Tarifa/día</span><span>{formatPEN(est.rate)}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span>{formatPEN(est.subtotal)}</span></div>
                            {est.discountPct > 0 && (
                              <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
                                <span>Descuento ({(est.discountPct * 100).toFixed(0)}%)</span>
                                <span>− {formatPEN(est.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-primary pt-2 border-t">
                              <span>Total estimado</span><span>{formatPEN(est.total)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-snug">
                              Precio referencial sujeto a confirmación según traslado, accesorios y condiciones del proyecto.
                            </p>
                          </div>
                        );
                      })()}


                      <Button type="submit" form="quote-form" className="w-full" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Solicitar Cotización
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        Te responderemos en menos de 24 horas hábiles
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default QuotePage;
