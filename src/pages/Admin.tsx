import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LogOut, Home, Building2, FolderOpen, Truck, Car, 
  Mail, Users, Settings, LayoutDashboard, Info, Briefcase, Heart, Image,
  Menu, ChevronLeft, ChevronRight, X, Quote, Navigation, BarChart3, Share2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import AdminHero from "@/components/admin/AdminHero";
import AdminServices from "@/components/admin/AdminServices";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminMachinery from "@/components/admin/AdminMachinery";
import AdminVehicles from "@/components/admin/AdminVehicles";
import AdminContact from "@/components/admin/AdminContact";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminJobApplications from "@/components/admin/AdminJobApplications";
import AdminJobPositions from "@/components/admin/AdminJobPositions";
import AdminBenefits from "@/components/admin/AdminBenefits";
import AdminAbout from "@/components/admin/AdminAbout";
import AdminSiteSettings from "@/components/admin/AdminSiteSettings";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import AdminNavigation from "@/components/admin/AdminNavigation";
import AdminTeamStats from "@/components/admin/AdminTeamStats";
import AdminSocialLinks from "@/components/admin/AdminSocialLinks";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: siteSettings } = useSiteSettings();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, category: "general" },
    { id: "site", label: "Logo & Sitio", icon: Image, category: "general" },
    { id: "navigation", label: "Navegación", icon: Navigation, category: "general" },
    { id: "social", label: "Redes Sociales", icon: Share2, category: "general" },
    { id: "hero", label: "Hero", icon: Home, category: "contenido" },
    { id: "about", label: "About", icon: Info, category: "contenido" },
    { id: "teamstats", label: "Estadísticas", icon: BarChart3, category: "contenido" },
    { id: "services", label: "Servicios", icon: Building2, category: "contenido" },
    { id: "projects", label: "Proyectos", icon: FolderOpen, category: "contenido" },
    { id: "testimonials", label: "Testimonios", icon: Quote, category: "contenido" },
    { id: "machinery", label: "Maquinaria", icon: Truck, category: "contenido" },
    { id: "vehicles", label: "Vehículos", icon: Car, category: "contenido" },
    { id: "contact", label: "Contacto", icon: Settings, category: "comunicacion" },
    { id: "messages", label: "Mensajes", icon: Mail, category: "comunicacion" },
    { id: "positions", label: "Vacantes", icon: Briefcase, category: "rrhh" },
    { id: "benefits", label: "Beneficios", icon: Heart, category: "rrhh" },
    { id: "applications", label: "Postulaciones", icon: Users, category: "rrhh" },
  ];

  const categories = [
    { id: "general", label: "General" },
    { id: "contenido", label: "Contenido" },
    { id: "comunicacion", label: "Comunicación" },
    { id: "rrhh", label: "Recursos Humanos" },
  ];

  const handleMenuClick = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className={cn(
        "p-4 border-b border-border/50",
        sidebarCollapsed && !isMobile && "px-2"
      )}>
        {(!sidebarCollapsed || isMobile) ? (
          <div className="flex items-center gap-3">
            {siteSettings?.logo_url ? (
              <img 
                src={siteSettings.logo_url} 
                alt={siteSettings.company_name || "Logo"} 
                className="h-8 object-contain"
              />
            ) : (
              <div className="bg-primary rounded-lg p-2">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm truncate">
                {siteSettings?.company_name || "ALEKSEY"}
              </p>
              <p className="text-xs text-muted-foreground truncate">CMS</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="bg-primary rounded-lg p-2">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-6 px-2">
          {categories.map((category) => (
            <div key={category.id}>
              {(!sidebarCollapsed || isMobile) && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {category.label}
                </p>
              )}
              <div className="space-y-1">
                {menuItems
                  .filter((item) => item.category === category.id)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        activeTab === item.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        sidebarCollapsed && !isMobile && "justify-center px-2"
                      )}
                      title={sidebarCollapsed && !isMobile ? item.label : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className={cn(
        "p-4 border-t border-border/50 space-y-2",
        sidebarCollapsed && !isMobile && "px-2"
      )}>
        <Link to="/" className="block">
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "w-full gap-2 justify-start",
              sidebarCollapsed && !isMobile && "justify-center px-2"
            )}
          >
            <Home className="h-4 w-4" />
            {(!sidebarCollapsed || isMobile) && <span>Ver sitio</span>}
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className={cn(
            "w-full gap-2 justify-start text-muted-foreground hover:text-destructive",
            sidebarCollapsed && !isMobile && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {(!sidebarCollapsed || isMobile) && <span>Cerrar sesión</span>}
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardOverview />;
      case "site": return <AdminSiteSettings />;
      case "navigation": return <AdminNavigation />;
      case "social": return <AdminSocialLinks />;
      case "hero": return <AdminHero />;
      case "about": return <AdminAbout />;
      case "teamstats": return <AdminTeamStats />;
      case "services": return <AdminServices />;
      case "projects": return <AdminProjects />;
      case "testimonials": return <AdminTestimonials />;
      case "machinery": return <AdminMachinery />;
      case "vehicles": return <AdminVehicles />;
      case "contact": return <AdminContact />;
      case "messages": return <AdminMessages />;
      case "positions": return <AdminJobPositions />;
      case "benefits": return <AdminBenefits />;
      case "applications": return <AdminJobApplications />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-card/95 backdrop-blur-md border-r border-border/50 transition-all duration-300 sticky top-0 h-screen",
        sidebarCollapsed ? "w-[72px]" : "w-64"
      )}>
        <SidebarContent />
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 bg-card border border-border rounded-full p-1.5 shadow-md hover:bg-muted transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile/Tablet Header */}
        <header className="lg:hidden bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SidebarContent isMobile />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2 min-w-0">
              {siteSettings?.logo_url ? (
                <img 
                  src={siteSettings.logo_url} 
                  alt={siteSettings.company_name || "Logo"} 
                  className="h-7 object-contain"
                />
              ) : (
                <span className="font-heading font-bold text-sm truncate">
                  {siteSettings?.company_name || "ALEKSEY"} CMS
                </span>
              )}
            </div>

            <Link to="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Current Section Indicator */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 text-sm">
              {(() => {
                const currentItem = menuItems.find(item => item.id === activeTab);
                if (currentItem) {
                  return (
                    <>
                      <currentItem.icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{currentItem.label}</span>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    services: 0,
    projects: 0,
    pendingMessages: 0,
    pendingApplications: 0,
  });
  const [messagesData, setMessagesData] = useState<{ month: string; count: number }[]>([]);
  const [projectsData, setProjectsData] = useState<{ year: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [servicesRes, projectsRes, messagesRes, applicationsRes] = await Promise.all([
          supabase.from("services").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        ]);

        setStats({
          services: servicesRes.count || 0,
          projects: projectsRes.count || 0,
          pendingMessages: messagesRes.count || 0,
          pendingApplications: applicationsRes.count || 0,
        });

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: messages } = await supabase
          .from("contact_messages")
          .select("created_at")
          .gte("created_at", sixMonthsAgo.toISOString());

        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const messagesByMonth: Record<string, number> = {};
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          messagesByMonth[key] = 0;
        }

        messages?.forEach((msg) => {
          const date = new Date(msg.created_at);
          const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (messagesByMonth[key] !== undefined) {
            messagesByMonth[key]++;
          }
        });

        setMessagesData(
          Object.entries(messagesByMonth).map(([month, count]) => ({ month, count }))
        );

        const { data: projects } = await supabase
          .from("projects")
          .select("year")
          .eq("is_active", true)
          .not("year", "is", null);

        const projectsByYear: Record<string, number> = {};
        projects?.forEach((proj) => {
          if (proj.year) {
            const yearStr = proj.year.toString();
            projectsByYear[yearStr] = (projectsByYear[yearStr] || 0) + 1;
          }
        });

        const sortedYears = Object.entries(projectsByYear)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .slice(-5)
          .map(([year, count]) => ({ year, count }));

        setProjectsData(sortedYears);

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Servicios", value: stats.services, description: "Servicios activos", icon: Building2, color: "from-blue-500 to-blue-600" },
    { label: "Proyectos", value: stats.projects, description: "Proyectos publicados", icon: FolderOpen, color: "from-emerald-500 to-emerald-600" },
    { label: "Mensajes", value: stats.pendingMessages, description: "Mensajes pendientes", icon: Mail, color: "from-amber-500 to-amber-600" },
    { label: "Postulaciones", value: stats.pendingApplications, description: "Postulaciones nuevas", icon: Users, color: "from-purple-500 to-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 md:p-6 border border-primary/20">
        <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
          Bienvenido al Panel de Administración
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Gestiona todo el contenido de tu sitio web desde aquí.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardHeader className="pb-2 relative p-3 md:p-6">
              <div className="flex items-center justify-between">
                <CardDescription className="font-medium text-xs md:text-sm">{stat.label}</CardDescription>
                <div className={`bg-gradient-to-br ${stat.color} p-1.5 md:p-2 rounded-lg shadow-lg`}>
                  <stat.icon className="h-3 w-3 md:h-4 md:w-4 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl md:text-4xl font-bold">
                {isLoading ? (
                  <span className="inline-block w-8 md:w-12 h-8 md:h-10 bg-muted animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <p className="text-xs md:text-sm text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-t-xl p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                  </div>
                  Mensajes por Mes
                </CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">Últimos 6 meses</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {messagesData.reduce((acc, curr) => acc + curr.count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total mensajes</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 p-4 md:p-6">
            {isLoading ? (
              <div className="h-48 md:h-64 bg-muted animate-pulse rounded-lg" />
            ) : (
              <ChartContainer
                config={{
                  count: { label: "Mensajes", color: "hsl(38, 92%, 50%)" },
                }}
                className="h-48 md:h-64"
              >
                <BarChart data={messagesData} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false}
                    className="stroke-muted/50" 
                  />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    dx={-8}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#messagesGradient)" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-t-xl p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <FolderOpen className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                  </div>
                  Proyectos por Año
                </CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">Distribución de proyectos</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {projectsData.reduce((acc, curr) => acc + curr.count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total proyectos</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 p-4 md:p-6">
            {isLoading ? (
              <div className="h-48 md:h-64 bg-muted animate-pulse rounded-lg" />
            ) : projectsData.length > 0 ? (
              <ChartContainer
                config={{
                  count: { label: "Proyectos", color: "hsl(152, 69%, 40%)" },
                }}
                className="h-48 md:h-64"
              >
                <BarChart data={projectsData} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="projectsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(152, 69%, 40%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(152, 69%, 40%)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false}
                    className="stroke-muted/50" 
                  />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    dx={-8}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#projectsGradient)" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-48 md:h-64 flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-dashed border-border">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                    <FolderOpen className="h-8 w-8 md:h-10 md:w-10 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No hay datos disponibles</p>
                  <p className="text-xs text-muted-foreground mt-1">Agrega proyectos con año asignado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
