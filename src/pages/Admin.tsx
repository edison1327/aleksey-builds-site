import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LogOut, Home, Building2, FolderOpen, Truck, Car, 
  Mail, Users, Settings, LayoutDashboard, Info, Briefcase, Heart, Image
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
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
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
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "site", label: "Logo & Sitio", icon: Image },
    { id: "hero", label: "Hero", icon: Home },
    { id: "about", label: "About", icon: Info },
    { id: "services", label: "Servicios", icon: Building2 },
    { id: "projects", label: "Proyectos", icon: FolderOpen },
    { id: "machinery", label: "Maquinaria", icon: Truck },
    { id: "vehicles", label: "Vehículos", icon: Car },
    { id: "contact", label: "Contacto", icon: Settings },
    { id: "messages", label: "Mensajes", icon: Mail },
    { id: "positions", label: "Vacantes", icon: Briefcase },
    { id: "benefits", label: "Beneficios", icon: Heart },
    { id: "applications", label: "Postulaciones", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {siteSettings?.logo_url ? (
              <img 
                src={siteSettings.logo_url} 
                alt={siteSettings.company_name || "Logo"} 
                className="h-8 object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="bg-primary rounded-lg p-2">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-heading font-bold text-foreground tracking-wide">
                  {siteSettings?.company_name || "ALEKSEY"}
                </span>
              </div>
            )}
            <div className="h-6 w-px bg-border hidden sm:block" />
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              Panel de Administración
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2 shadow-sm hover:shadow transition-shadow">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Ver sitio</span>
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut} 
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Improved Navigation */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg p-2">
            <ScrollArea className="w-full">
              <TabsList className="flex w-max gap-1 bg-transparent p-0">
                {menuItems.map((item) => (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="gap-2 px-4 py-2.5 rounded-xl text-muted-foreground transition-all duration-300
                      data-[state=active]:bg-primary data-[state=active]:text-primary-foreground 
                      data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25
                      hover:bg-muted hover:text-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Content Cards with animations */}
          <div className="animate-fade-in">
            <TabsContent value="dashboard" className="mt-0">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="site" className="mt-0">
              <AdminSiteSettings />
            </TabsContent>

            <TabsContent value="hero" className="mt-0">
              <AdminHero />
            </TabsContent>

            <TabsContent value="about" className="mt-0">
              <AdminAbout />
            </TabsContent>

            <TabsContent value="services" className="mt-0">
              <AdminServices />
            </TabsContent>

            <TabsContent value="projects" className="mt-0">
              <AdminProjects />
            </TabsContent>

            <TabsContent value="machinery" className="mt-0">
              <AdminMachinery />
            </TabsContent>

            <TabsContent value="vehicles" className="mt-0">
              <AdminVehicles />
            </TabsContent>

            <TabsContent value="contact" className="mt-0">
              <AdminContact />
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <AdminMessages />
            </TabsContent>

            <TabsContent value="positions" className="mt-0">
              <AdminJobPositions />
            </TabsContent>

            <TabsContent value="benefits" className="mt-0">
              <AdminBenefits />
            </TabsContent>

            <TabsContent value="applications" className="mt-0">
              <AdminJobApplications />
            </TabsContent>
          </div>
        </Tabs>
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
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border border-primary/20">
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
          Bienvenido al Panel de Administración
        </h2>
        <p className="text-muted-foreground">
          Gestiona todo el contenido de tu sitio web desde aquí.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardDescription className="font-medium">{stat.label}</CardDescription>
                <div className={`bg-gradient-to-br ${stat.color} p-2 rounded-lg shadow-lg`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold">
                {isLoading ? (
                  <span className="inline-block w-12 h-10 bg-muted animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Mensajes por Mes
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : (
              <ChartContainer
                config={{
                  count: { label: "Mensajes", color: "hsl(var(--primary))" },
                }}
                className="h-64"
              >
                <BarChart data={messagesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Proyectos por Año
            </CardTitle>
            <CardDescription>Distribución de proyectos</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : projectsData.length > 0 ? (
              <ChartContainer
                config={{
                  count: { label: "Proyectos", color: "hsl(var(--primary))" },
                }}
                className="h-64"
              >
                <BarChart data={projectsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
                <div className="text-center">
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay datos de proyectos por año</p>
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
