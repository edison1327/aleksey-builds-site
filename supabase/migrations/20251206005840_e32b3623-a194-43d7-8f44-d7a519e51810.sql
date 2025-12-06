-- Create table for job positions
CREATE TABLE public.job_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Tiempo completo',
  salary TEXT,
  description TEXT,
  requirements JSONB,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for company benefits
CREATE TABLE public.company_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Star',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_benefits ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_positions
CREATE POLICY "Anyone can view active job positions" 
ON public.job_positions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage job positions" 
ON public.job_positions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for company_benefits
CREATE POLICY "Anyone can view active benefits" 
ON public.company_benefits 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage benefits" 
ON public.company_benefits 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default data
INSERT INTO public.company_benefits (title, description, icon, sort_order) VALUES
('Salario Competitivo', 'Ofrecemos salarios por encima del mercado con bonificaciones por desempeño', 'DollarSign', 1),
('Capacitación Continua', 'Programas de formación y certificaciones profesionales', 'GraduationCap', 2),
('Seguro de Salud', 'Cobertura médica completa para ti y tu familia', 'Shield', 3),
('Crecimiento Profesional', 'Oportunidades de ascenso y desarrollo de carrera', 'TrendingUp', 4),
('Ambiente Colaborativo', 'Equipos de trabajo dinámicos y proyectos desafiantes', 'Users', 5),
('Estabilidad Laboral', 'Empresa consolidada con proyectos a largo plazo', 'Building2', 6);

INSERT INTO public.job_positions (title, department, location, type, salary, sort_order) VALUES
('Ingeniero Civil Senior', 'Ingeniería', 'Lima, Perú', 'Tiempo completo', 'S/. 8,000 - 12,000', 1),
('Supervisor de Obra', 'Construcción', 'Lima, Perú', 'Tiempo completo', 'S/. 5,000 - 7,000', 2),
('Operador de Maquinaria Pesada', 'Operaciones', 'Lima, Perú', 'Tiempo completo', 'S/. 3,500 - 5,000', 3),
('Asistente Administrativo', 'Administración', 'Lima, Perú', 'Tiempo completo', 'S/. 2,500 - 3,500', 4);