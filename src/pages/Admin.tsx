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
  Menu, ChevronLeft, ChevronRight, X, Quote, Navigation, BarChart3, Share2,
  FileText, TrendingUp
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
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
import NotificationCenter from "@/components/admin/NotificationCenter";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

import { useToast } from "@/hooks/use-toast";

// Safety alias: prevents runtime ReferenceError if any code still references Tooltip
const Tooltip = RechartsTooltip;

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const { data: siteSettings } = useSiteSettings();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    // Subscribe to realtime updates for new messages/quotes notification
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          const message = payload.new as { message?: string; name?: string };
          const isQuote = message.message?.startsWith('[Cotización');
          
          setNewMessagesCount(prev => prev + 1);
          
          toast({
            title: isQuote ? "Nueva cotización recibida" : "Nuevo mensaje recibido",
            description: `De: ${message.name || 'Usuario'}`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      setNewMessagesCount(count || 0);
    };
    fetchUnreadCount();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

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
                      onClick={() => {
                        handleMenuClick(item.id);
                        if (item.id === 'messages') {
                          setNewMessagesCount(0);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                        activeTab === item.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        sidebarCollapsed && !isMobile && "justify-center px-2"
                      )}
                      title={sidebarCollapsed && !isMobile ? item.label : undefined}
                    >
                      <div className="relative">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.id === 'messages' && newMessagesCount > 0 && (
                          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold items-center justify-center">
                              {newMessagesCount > 9 ? '9+' : newMessagesCount}
                            </span>
                          </span>
                        )}
                      </div>
                      {(!sidebarCollapsed || isMobile) && (
                        <span className="flex items-center gap-2">
                          {item.label}
                          {item.id === 'messages' && newMessagesCount > 0 && (
                            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                              {newMessagesCount} nuevo{newMessagesCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </span>
                      )}
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
        {/* Notification Center in sidebar */}
        <div className={cn(
          "flex items-center gap-2 mb-2",
          sidebarCollapsed && !isMobile ? "justify-center" : "justify-start"
        )}>
          <NotificationCenter onNavigateToMessages={() => setActiveTab("messages")} />
          {(!sidebarCollapsed || isMobile) && (
            <span className="text-xs text-muted-foreground">Notificaciones</span>
          )}
        </div>
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

            <div className="flex items-center gap-1">
              <NotificationCenter onNavigateToMessages={() => setActiveTab("messages")} />
              <Link to="/">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
            </div>
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
    respondedMessages: 0,
    totalMessages: 0,
    pendingApplications: 0,
    reviewedApplications: 0,
    totalApplications: 0,
    machinery: 0,
    vehicles: 0,
    testimonials: 0,
  });
  const [recentMessages, setRecentMessages] = useState<{ id: string; name: string; email: string; status: string; created_at: string }[]>([]);
  const [recentApplications, setRecentApplications] = useState<{ id: string; name: string; position: string; status: string; created_at: string }[]>([]);
  const [messagesData, setMessagesData] = useState<{ month: string; count: number }[]>([]);
  const [quotesData, setQuotesData] = useState<{ month: string; count: number }[]>([]);
  const [quotesByTypeData, setQuotesByTypeData] = useState<{ type: string; count: number; fill: string }[]>([]);
  const [projectsData, setProjectsData] = useState<{ year: string; count: number }[]>([]);
  const [machineryData, setMachineryData] = useState<{ category: string; count: number }[]>([]);
  const [vehiclesData, setVehiclesData] = useState<{ category: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all counts in parallel
        const [
          servicesRes, 
          projectsRes, 
          pendingMessagesRes, 
          respondedMessagesRes,
          totalMessagesRes,
          pendingAppsRes, 
          reviewedAppsRes,
          totalAppsRes,
          machineryRes, 
          vehiclesRes,
          testimonialsRes,
          recentMessagesRes,
          recentAppsRes,
        ] = await Promise.all([
          supabase.from("services").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "responded"),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }),
          supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("job_applications").select("id", { count: "exact", head: true }).neq("status", "pending"),
          supabase.from("job_applications").select("id", { count: "exact", head: true }),
          supabase.from("machinery").select("id, category", { count: "exact" }).eq("is_active", true),
          supabase.from("vehicles").select("id, category", { count: "exact" }).eq("is_active", true),
          supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("contact_messages").select("id, name, email, status, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("job_applications").select("id, name, position, status, created_at").order("created_at", { ascending: false }).limit(5),
        ]);

        setStats({
          services: servicesRes.count || 0,
          projects: projectsRes.count || 0,
          pendingMessages: pendingMessagesRes.count || 0,
          respondedMessages: respondedMessagesRes.count || 0,
          totalMessages: totalMessagesRes.count || 0,
          pendingApplications: pendingAppsRes.count || 0,
          reviewedApplications: reviewedAppsRes.count || 0,
          totalApplications: totalAppsRes.count || 0,
          machinery: machineryRes.count || 0,
          vehicles: vehiclesRes.count || 0,
          testimonials: testimonialsRes.count || 0,
        });

        setRecentMessages(recentMessagesRes.data || []);
        setRecentApplications(recentAppsRes.data || []);

        // Group machinery by category
        const machineryByCategory: Record<string, number> = {};
        machineryRes.data?.forEach((item) => {
          const cat = item.category || "Sin categoría";
          machineryByCategory[cat] = (machineryByCategory[cat] || 0) + 1;
        });
        setMachineryData(
          Object.entries(machineryByCategory)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
        );

        // Group vehicles by category
        const vehiclesByCategory: Record<string, number> = {};
        vehiclesRes.data?.forEach((item) => {
          const cat = item.category || "Sin categoría";
          vehiclesByCategory[cat] = (vehiclesByCategory[cat] || 0) + 1;
        });
        setVehiclesData(
          Object.entries(vehiclesByCategory)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
        );

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: messages } = await supabase
          .from("contact_messages")
          .select("created_at, message")
          .gte("created_at", sixMonthsAgo.toISOString());

        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const messagesByMonth: Record<string, number> = {};
        const quotesByMonth: Record<string, number> = {};
        const quotesByType: Record<string, number> = {
          "Maquinaria": 0,
          "Vehículos": 0,
          "Servicios": 0,
        };
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          messagesByMonth[key] = 0;
          quotesByMonth[key] = 0;
        }

        messages?.forEach((msg) => {
          const date = new Date(msg.created_at);
          const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (messagesByMonth[key] !== undefined) {
            messagesByMonth[key]++;
            // Check if it's a quote request
            const messageText = msg.message?.toLowerCase() || '';
            const isQuote = messageText.includes('[cotización') || messageText.includes('[cotizacion');
            
            if (isQuote) {
              quotesByMonth[key]++;
              // Detect type from message content
              if (messageText.includes('maquinaria') || messageText.includes('excavadora') || messageText.includes('retroexcavadora') || messageText.includes('cargador')) {
                quotesByType["Maquinaria"]++;
              } else if (messageText.includes('vehículo') || messageText.includes('vehiculo') || messageText.includes('camión') || messageText.includes('camion') || messageText.includes('cisterna') || messageText.includes('volquete') || messageText.includes('mixer')) {
                quotesByType["Vehículos"]++;
              } else if (messageText.includes('servicio') || messageText.includes('ingeniería') || messageText.includes('ingenieria') || messageText.includes('construcción') || messageText.includes('construccion')) {
                quotesByType["Servicios"]++;
              } else {
                // Default to machinery for general quotes
                quotesByType["Maquinaria"]++;
              }
            }
          }
        });

        setMessagesData(
          Object.entries(messagesByMonth).map(([month, count]) => ({ month, count }))
        );

        setQuotesData(
          Object.entries(quotesByMonth).map(([month, count]) => ({ month, count }))
        );

        const typeColors: Record<string, string> = {
          "Maquinaria": "hsl(25, 95%, 53%)",
          "Vehículos": "hsl(187, 85%, 43%)",
          "Servicios": "hsl(250, 80%, 60%)",
        };

        setQuotesByTypeData(
          Object.entries(quotesByType)
            .map(([type, count]) => ({ type, count, fill: typeColors[type] }))
            .filter(item => item.count > 0)
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

    // Subscribe to realtime updates for contact_messages
    const channel = supabase
      .channel('dashboard-quotes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_messages'
        },
        () => {
          console.log('New quote/message received, refreshing stats...');
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { label: "Servicios", value: stats.services, description: "Servicios activos", icon: Building2, color: "from-blue-500 to-blue-600" },
    { label: "Proyectos", value: stats.projects, description: "Proyectos publicados", icon: FolderOpen, color: "from-emerald-500 to-emerald-600" },
    { label: "Maquinaria", value: stats.machinery, description: "Equipos disponibles", icon: Truck, color: "from-orange-500 to-orange-600" },
    { label: "Vehículos", value: stats.vehicles, description: "Vehículos disponibles", icon: Car, color: "from-cyan-500 to-cyan-600" },
    { label: "Testimonios", value: stats.testimonials, description: "Testimonios activos", icon: Quote, color: "from-pink-500 to-pink-600" },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendiente", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
      responded: { label: "Respondido", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      reviewed: { label: "Revisado", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      accepted: { label: "Aceptado", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
      rejected: { label: "Rechazado", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    };
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

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

      {/* Messages & Applications Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Messages Summary */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                </div>
                Mensajes de Contacto
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-2xl md:text-3xl font-bold text-amber-600">{stats.pendingMessages}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.respondedMessages}</p>
                <p className="text-xs text-muted-foreground">Respondidos</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalMessages}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">Últimos mensajes</p>
              {recentMessages.length > 0 ? (
                recentMessages.slice(0, 4).map((msg) => (
                  <div key={msg.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{msg.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {getStatusBadge(msg.status || 'pending')}
                      <span className="text-xs text-muted-foreground hidden md:inline">{formatDate(msg.created_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay mensajes recientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Applications Summary */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                </div>
                Postulaciones de Empleo
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-2xl md:text-3xl font-bold text-amber-600">{stats.pendingApplications}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.reviewedApplications}</p>
                <p className="text-xs text-muted-foreground">Revisadas</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalApplications}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">Últimas postulaciones</p>
              {recentApplications.length > 0 ? (
                recentApplications.slice(0, 4).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{app.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.position}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {getStatusBadge(app.status || 'pending')}
                      <span className="text-xs text-muted-foreground hidden md:inline">{formatDate(app.created_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay postulaciones recientes</p>
              )}
            </div>
          </CardContent>
        </Card>
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

      {/* Quote Trend Chart */}
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent rounded-t-xl p-4 md:p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-rose-500" />
                </div>
                Tendencia de Cotizaciones
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">Solicitudes de cotización por mes</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {quotesData.reduce((acc, curr) => acc + curr.count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total cotizaciones</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 p-4 md:p-6">
          {isLoading ? (
            <div className="h-48 md:h-64 bg-muted animate-pulse rounded-lg" />
          ) : (
            <ChartContainer
              config={{
                count: { label: "Cotizaciones", color: "hsl(350, 89%, 60%)" },
              }}
              className="h-48 md:h-64"
            >
              <AreaChart data={quotesData}>
                <defs>
                  <linearGradient id="quotesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(350, 89%, 60%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(350, 89%, 60%)" stopOpacity={0.05} />
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
                  cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone"
                  dataKey="count" 
                  stroke="hsl(350, 89%, 60%)" 
                  strokeWidth={3}
                  fill="url(#quotesGradient)"
                  dot={{ fill: 'hsl(350, 89%, 60%)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(350, 89%, 60%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Quotes by Type Chart */}
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent rounded-t-xl p-4 md:p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-violet-500" />
                </div>
                Cotizaciones por Tipo
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">Desglose por categoría de solicitud</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {quotesByTypeData.reduce((acc, curr) => acc + curr.count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total cotizaciones</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 p-4 md:p-6">
          {isLoading ? (
            <div className="h-48 md:h-64 bg-muted animate-pulse rounded-lg" />
          ) : quotesByTypeData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quotesByTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="count"
                      strokeWidth={0}
                    >
                      {quotesByTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} solicitudes`, props.payload.type]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-3">
                {quotesByTypeData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="font-medium text-sm">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{item.count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((item.count / quotesByTypeData.reduce((a, b) => a + b.count, 0)) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 md:h-64 flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-dashed border-border">
              <div className="text-center">
                <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                  <FileText className="h-8 w-8 md:h-10 md:w-10 opacity-50" />
                </div>
                <p className="text-sm font-medium">No hay cotizaciones registradas</p>
                <p className="text-xs text-muted-foreground mt-1">Las solicitudes de cotización aparecerán aquí</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent rounded-t-xl p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Truck className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                  </div>
                  Maquinaria por Categoría
                </CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">Distribución de equipos</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{stats.machinery}</p>
                <p className="text-xs text-muted-foreground">Total equipos</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 p-4 md:p-6">
            {isLoading ? (
              <div className="h-48 md:h-64 bg-muted animate-pulse rounded-lg" />
            ) : machineryData.length > 0 ? (
              <ChartContainer
                config={{
                  count: { label: "Equipos", color: "hsl(25, 95%, 53%)" },
                }}
                className="h-48 md:h-64"
              >
                <BarChart data={machineryData} barCategoryGap="20%" layout="vertical">
                  <defs>
                    <linearGradient id="machineryGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    horizontal={false}
                    className="stroke-muted/50" 
                  />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#machineryGradient)" 
                    radius={[0, 8, 8, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-48 md:h-64 flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-dashed border-border">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                    <Truck className="h-8 w-8 md:h-10 md:w-10 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No hay maquinaria registrada</p>
                  <p className="text-xs text-muted-foreground mt-1">Agrega equipos desde la sección Maquinaria</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent rounded-t-xl p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Car className="h-4 w-4 md:h-5 md:w-5 text-cyan-500" />
                  </div>
                  Vehículos por Categoría
                </CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">Distribución de flota</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{stats.vehicles}</p>
                <p className="text-xs text-muted-foreground">Total vehículos</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 p-4 md:p-6">
            {isLoading ? (
              <div className="h-48 md:h-64 bg-muted animate-pulse rounded-lg" />
            ) : vehiclesData.length > 0 ? (
              <ChartContainer
                config={{
                  count: { label: "Vehículos", color: "hsl(187, 85%, 43%)" },
                }}
                className="h-48 md:h-64"
              >
                <BarChart data={vehiclesData} barCategoryGap="20%" layout="vertical">
                  <defs>
                    <linearGradient id="vehiclesGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(187, 85%, 43%)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(187, 85%, 43%)" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    horizontal={false}
                    className="stroke-muted/50" 
                  />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#vehiclesGradient)" 
                    radius={[0, 8, 8, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-48 md:h-64 flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-dashed border-border">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                    <Car className="h-8 w-8 md:h-10 md:w-10 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No hay vehículos registrados</p>
                  <p className="text-xs text-muted-foreground mt-1">Agrega vehículos desde la sección Vehículos</p>
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
