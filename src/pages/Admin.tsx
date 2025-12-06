import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, Home, Building2, FolderOpen, Truck, Car, 
  Mail, Users, Settings, LayoutDashboard, Info
} from "lucide-react";
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Servicios</CardDescription>
          <CardTitle className="text-3xl">-</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Servicios activos</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Proyectos</CardDescription>
          <CardTitle className="text-3xl">-</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Proyectos publicados</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Mensajes</CardDescription>
          <CardTitle className="text-3xl">-</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Mensajes pendientes</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Postulaciones</CardDescription>
          <CardTitle className="text-3xl">-</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Postulaciones nuevas</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
