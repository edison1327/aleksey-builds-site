-- Create navigation_links table for managing navbar and footer links
CREATE TABLE public.navigation_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  path TEXT NOT NULL,
  icon TEXT DEFAULT 'Home',
  location TEXT NOT NULL DEFAULT 'navbar', -- 'navbar', 'footer_services', 'footer_company'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_stats table for managing statistics (engineers, technicians, etc.)
CREATE TABLE public.team_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT DEFAULT 'Users',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.navigation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for navigation_links
CREATE POLICY "Admins can manage navigation links"
ON public.navigation_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active navigation links"
ON public.navigation_links
FOR SELECT
USING (is_active = true);

-- RLS policies for team_stats
CREATE POLICY "Admins can manage team stats"
ON public.team_stats
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active team stats"
ON public.team_stats
FOR SELECT
USING (is_active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_navigation_links_updated_at
BEFORE UPDATE ON public.navigation_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_stats_updated_at
BEFORE UPDATE ON public.team_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default navigation links
INSERT INTO public.navigation_links (label, path, icon, location, sort_order) VALUES
('INICIO', '/', 'Home', 'navbar', 1),
('SOBRE NOSOTROS', '/nosotros', 'Users', 'navbar', 2),
('PROYECTOS', '/proyectos', 'FolderKanban', 'navbar', 3),
('CONTACTO', '/#contact', 'Phone', 'navbar', 4),
('Construcción', '/construccion', 'Building2', 'footer_services', 1),
('Ingeniería', '/ingenieria', 'Wrench', 'footer_services', 2),
('Vehículos', '/vehiculos', 'Truck', 'footer_services', 3),
('Maquinaria', '/maquinaria', 'Settings', 'footer_services', 4),
('Sobre Nosotros', '/nosotros', 'Users', 'footer_company', 1),
('Proyectos', '/proyectos', 'FolderKanban', 'footer_company', 2),
('Contacto', '/#contact', 'Phone', 'footer_company', 3),
('Trabaja con Nosotros', '/convocatoria', 'Briefcase', 'footer_company', 4);

-- Insert default team stats
INSERT INTO public.team_stats (label, value, icon, sort_order) VALUES
('Ingenieros', '25+', 'Users', 1),
('Técnicos', '50+', 'Wrench', 2),
('Proyectos Activos', '15', 'Building2', 3),
('Años de Experiencia', '10+', 'Award', 4);