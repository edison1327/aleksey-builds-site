import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, Home, Building2, FolderOpen, Truck, Car, 
  Mail, Users, Settings, LayoutDashboard, Info
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
import AdminAbout from "@/components/admin/AdminAbout";

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "hero", label: "Hero", icon: Home },
    { id: "about", label: "About", icon: Info },
    { id: "services", label: "Servicios", icon: Building2 },
    { id: "projects", label: "Proyectos", icon: FolderOpen },
    { id: "machinery", label: "Maquinaria", icon: Truck },
    { id: "vehicles", label: "Vehículos", icon: Car },
    { id: "contact", label: "Contacto", icon: Settings },
    { id: "messages", label: "Mensajes", icon: Mail },
    { id: "applications", label: "Postulaciones", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-heading font-bold text-foreground tracking-wide">
              ALEKSEY CMS
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Ver sitio
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 h-auto bg-card p-2 rounded-xl">
            {menuItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="hero">
            <AdminHero />
          </TabsContent>

          <TabsContent value="about">
            <AdminAbout />
          </TabsContent>

          <TabsContent value="services">
            <AdminServices />
          </TabsContent>

          <TabsContent value="projects">
            <AdminProjects />
          </TabsContent>

          <TabsContent value="machinery">
            <AdminMachinery />
          </TabsContent>

          <TabsContent value="vehicles">
            <AdminVehicles />
          </TabsContent>

          <TabsContent value="contact">
            <AdminContact />
          </TabsContent>

          <TabsContent value="messages">
            <AdminMessages />
          </TabsContent>

          <TabsContent value="applications">
            <AdminJobApplications />
          </TabsContent>
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
        // Fetch counts
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

        // Fetch messages for chart (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: messages } = await supabase
          .from("contact_messages")
          .select("created_at")
          .gte("created_at", sixMonthsAgo.toISOString());

        // Group messages by month
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const messagesByMonth: Record<string, number> = {};
        
        // Initialize last 6 months
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

        // Fetch projects by year
        const { data: projects } = await supabase
          .from("projects")
          .select("year")
          .eq("is_active", true)
          .not("year", "is", null);

        // Group projects by year
        const projectsByYear: Record<string, number> = {};
        projects?.forEach((proj) => {
          if (proj.year) {
            const yearStr = proj.year.toString();
            projectsByYear[yearStr] = (projectsByYear[yearStr] || 0) + 1;
          }
        });

        // Sort by year and take last 5 years
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
    { label: "Servicios", value: stats.services, description: "Servicios activos", icon: Building2 },
    { label: "Proyectos", value: stats.projects, description: "Proyectos publicados", icon: FolderOpen },
    { label: "Mensajes", value: stats.pendingMessages, description: "Mensajes pendientes", icon: Mail },
    { label: "Postulaciones", value: stats.pendingApplications, description: "Postulaciones nuevas", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{stat.label}</CardDescription>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl">
                {isLoading ? (
                  <span className="inline-block w-8 h-8 bg-muted animate-pulse rounded" />
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
        {/* Messages Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mensajes por Mes</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded" />
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
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Projects Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proyectos por Año</CardTitle>
            <CardDescription>Distribución de proyectos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded" />
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
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos de proyectos por año
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
