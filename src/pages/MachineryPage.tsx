import { useMemo, useState } from "react";
import { Settings, Clock, Shield, Wrench, Search, X, GitCompare, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { useMachinery, Machinery } from "@/hooks/useSiteData";
import { useLocalizedField } from "@/lib/i18nField";
import { Skeleton } from "@/components/ui/skeleton";
import QuickQuoteForm from "@/components/QuickQuoteForm";

import excavadoraCaterpillar from "@/assets/excavadora-caterpillar.jpg";
import cargadorVolvo from "@/assets/cargador-volvo.jpg";
import retroexcavadoraJcb from "@/assets/retroexcavadora-jcb.jpg";

const defaultImages = [excavadoraCaterpillar, cargadorVolvo, retroexcavadoraJcb];

const benefits = [
  { icon: Shield, title: "Equipos Certificados", desc: "Toda nuestra maquinaria cuenta con certificaciones vigentes" },
  { icon: Wrench, title: "Soporte Técnico", desc: "Servicio técnico especializado disponible en obra" },
  { icon: Clock, title: "Entrega Rápida", desc: "Entrega y recogida en el lugar de su proyecto" },
];

const MAX_COMPARE = 3;

const MachineryPage = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: machineryRef, isVisible: machineryVisible } = useScrollAnimation(0.1);
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollAnimation(0.2);
  const navigate = useNavigate();
  const [selectedMachine, setSelectedMachine] = useState<Machinery | null>(null);
  const tr = useLocalizedField();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");

  // Compare
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data: machinery, isLoading } = useMachinery();

  const categories = useMemo(() => {
    const set = new Set<string>();
    machinery.forEach((m) => m.category && set.add(m.category));
    return Array.from(set).sort();
  }, [machinery]);

  const filtered = useMemo(() => {
    return machinery.filter((m) => {
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (availabilityFilter === "available" && !m.is_available) return false;
      if (availabilityFilter === "unavailable" && m.is_available) return false;
      if (search) {
        const t = search.toLowerCase();
        const hay = `${m.name} ${m.brand || ""} ${m.model || ""} ${m.category || ""} ${m.description || ""}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [machinery, search, categoryFilter, availabilityFilter]);

  const compareItems = useMemo(
    () => compareIds.map((id) => machinery.find((m) => m.id === id)).filter(Boolean) as Machinery[],
    [compareIds, machinery],
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const scrollToContact = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getDefaultImage = (index: number) => defaultImages[index % defaultImages.length];

  return (
    <div className="min-h-dvh">
      {/* Hero */}
      <section className="relative pt-24 bg-secondary">
        <div
          ref={heroRef}
          className={`container mx-auto px-4 py-24 text-center opacity-0 ${heroVisible ? "animate-fade-in" : ""}`}
        >
          <div className="bg-primary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-secondary-foreground tracking-wide mb-6">
            MAQUINARIA PESADA
          </h1>
          <p className="text-xl text-primary max-w-3xl mx-auto leading-relaxed">
            Alquiler de equipos de construcción de última generación. Maquinaria pesada para proyectos de cualquier escala.
          </p>
        </div>
      </section>

      {/* Machinery + filters */}
      <section ref={machineryRef} className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              machineryVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 tracking-wide">
              NUESTROS EQUIPOS
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Filtra por categoría, busca por nombre o marca, y compara hasta {MAX_COMPARE} equipos lado a lado.
            </p>
          </div>

          {/* Filter bar */}
          <Card className="mb-8 border-0 shadow-md">
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, marca, modelo…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="md:w-56">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as typeof availabilityFilter)}>
                  <SelectTrigger className="md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="available">Disponibles</SelectItem>
                    <SelectItem value="unavailable">No disponibles</SelectItem>
                  </SelectContent>
                </Select>
                {(search || categoryFilter !== "all" || availabilityFilter !== "all") && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("all");
                      setAvailabilityFilter("all");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Limpiar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Mostrando <strong>{filtered.length}</strong> de {machinery.length} equipos
              </p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No hay equipos que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item, index) => {
                const isSelected = compareIds.includes(item.id);
                const compareDisabled = !isSelected && compareIds.length >= MAX_COMPARE;
                return (
                  <Card
                    key={item.id}
                    className={`group relative cursor-pointer overflow-hidden border-2 bg-card hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                      isSelected ? "border-primary" : "border-transparent"
                    } ${machineryVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    style={{ transitionDelay: `${(index % 6) * 100}ms` }}
                  >
                    {/* Compare toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!compareDisabled) toggleCompare(item.id);
                      }}
                      disabled={compareDisabled}
                      className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur transition ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : compareDisabled
                          ? "bg-white/60 text-muted-foreground cursor-not-allowed"
                          : "bg-white/80 text-foreground hover:bg-white"
                      }`}
                      title={isSelected ? "Quitar de comparación" : compareDisabled ? `Máx ${MAX_COMPARE}` : "Comparar"}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : <GitCompare className="h-3 w-3" />}
                      {isSelected ? "Seleccionado" : "Comparar"}
                    </button>

                    <div onClick={() => setSelectedMachine(item)}>
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={item.image_url || getDefaultImage(index)}
                          alt={tr(item as any, "name") || item.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div
                          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                            item.is_available ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {item.is_available ? "Disponible" : "No disponible"}
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-lg font-heading font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {tr(item as any, "name") || item.name}
                        </h3>
                        {item.brand && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.brand} {item.model}
                          </p>
                        )}
                        {item.category && (
                          <Badge variant="secondary" className="text-xs">
                            {tr(item as any, "category") || item.category}
                          </Badge>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Floating compare bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border shadow-2xl rounded-full pl-4 pr-2 py-2 flex items-center gap-3 max-w-[95vw]">
          <GitCompare className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap">
            {compareIds.length} seleccionado{compareIds.length > 1 ? "s" : ""}
          </span>
          <Button size="sm" onClick={() => setCompareOpen(true)} disabled={compareIds.length < 2}>
            Comparar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCompareIds([])}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Compare modal */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparar equipos ({compareItems.length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted-foreground font-medium w-32">Atributo</th>
                  {compareItems.map((m) => (
                    <th key={m.id} className="p-2 align-bottom">
                      <div className="space-y-2">
                        <img
                          src={m.image_url || getDefaultImage(0)}
                          alt={tr(m as any, "name") || m.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <p className="font-heading font-bold">{tr(m as any, "name") || m.name}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_tr]:border-t">
                {[
                  { label: "Marca", get: (m: Machinery) => m.brand || "—" },
                  { label: "Modelo", get: (m: Machinery) => m.model || "—" },
                  { label: "Categoría", get: (m: Machinery) => tr(m as any, "category") || m.category || "—" },
                  {
                    label: "Disponibilidad",
                    get: (m: Machinery) => (m.is_available ? "Disponible" : "No disponible"),
                  },
                  { label: "Descripción", get: (m: Machinery) => tr(m as any, "description") || m.description || "—" },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="p-2 text-muted-foreground font-medium align-top">{row.label}</td>
                    {compareItems.map((m) => (
                      <td key={m.id} className="p-2 align-top">
                        {row.get(m)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-2 text-muted-foreground font-medium">Acción</td>
                  {compareItems.map((m) => (
                    <td key={m.id} className="p-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setCompareOpen(false);
                          navigate(`/cotizar?tipo=maquinaria&id=${m.id}`);
                        }}
                        disabled={!m.is_available}
                      >
                        Cotizar
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail modal */}
      <Dialog open={!!selectedMachine} onOpenChange={() => setSelectedMachine(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading font-bold">
              {tr(selectedMachine as any, "name") || selectedMachine?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMachine && (
            <div className="space-y-6">
              <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
                <img
                  src={selectedMachine.image_url || getDefaultImage(0)}
                  alt={tr(selectedMachine as any, "name") || selectedMachine.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className={`absolute top-4 right-4 px-4 py-2 rounded-full font-bold ${
                    selectedMachine.is_available ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  {selectedMachine.is_available ? "Disponible" : "No disponible"}
                </div>
              </div>

              {(tr(selectedMachine as any, "description") || selectedMachine.description) && (
                <p className="text-muted-foreground">{tr(selectedMachine as any, "description") || selectedMachine.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedMachine.brand && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Marca</span>
                    <p className="font-bold text-foreground">{selectedMachine.brand}</p>
                  </div>
                )}
                {selectedMachine.model && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Modelo</span>
                    <p className="font-bold text-foreground">{selectedMachine.model}</p>
                  </div>
                )}
                {selectedMachine.category && (
                  <div className="bg-muted p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Categoría</span>
                    <p className="font-bold text-foreground">{selectedMachine.category}</p>
                  </div>
                )}
              </div>

              {selectedMachine.is_available ? (
                <QuickQuoteForm
                  itemName={selectedMachine.name}
                  itemType="maquinaria"
                  onSuccess={() => setSelectedMachine(null)}
                />
              ) : (
                <div className="border-t pt-4 mt-4">
                  <p className="text-center text-muted-foreground">
                    Esta maquinaria no está disponible actualmente.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Benefits */}
      <section ref={benefitsRef} className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              benefitsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-wide">
              ¿POR QUÉ ALQUILAR CON NOSOTROS?
            </h2>
            <p className="text-lg text-secondary-foreground/80 max-w-2xl mx-auto">
              Garantizamos equipos en óptimas condiciones y soporte técnico profesional
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className={`bg-secondary-foreground/10 border-0 text-center transition-all duration-700 ${
                  benefitsVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-8">
                  <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2">{benefit.title}</h3>
                  <p className="text-secondary-foreground/70 text-sm">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-wide">
            ¿NECESITA MAQUINARIA PARA SU PROYECTO?
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Contáctenos para conocer disponibilidad y tarifas especiales por proyectos largos
          </p>
          <Button
            size="lg"
            onClick={scrollToContact}
            variant="secondary"
            className="font-heading tracking-wider px-8"
          >
            CONTACTAR AHORA
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MachineryPage;
