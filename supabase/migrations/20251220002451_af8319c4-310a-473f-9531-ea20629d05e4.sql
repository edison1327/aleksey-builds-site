-- Create testimonials table
CREATE TABLE public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  company text NOT NULL,
  content text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Policy for public viewing
CREATE POLICY "Anyone can view active testimonials"
ON public.testimonials
FOR SELECT
USING (is_active = true);

-- Policy for admin management
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default testimonials
INSERT INTO public.testimonials (name, role, company, content, rating, sort_order) VALUES
('Carlos Mendoza', 'Gerente de Proyectos', 'Constructora Lima SAC', 'Excelente servicio y profesionalismo. El equipo de ALEKSEY cumplió con todos los plazos establecidos y la calidad del trabajo superó nuestras expectativas. Definitivamente los recomendaría.', 5, 1),
('María García', 'Directora de Operaciones', 'Inmobiliaria del Sur', 'La maquinaria que alquilamos estaba en perfectas condiciones y el soporte técnico fue excepcional. Han sido nuestros aliados en múltiples proyectos residenciales.', 5, 2),
('Roberto Sánchez', 'Ingeniero Civil', 'Proyectos Andinos', 'Profesionales de primera. Su experiencia en ingeniería geotécnica nos ayudó a resolver problemas complejos de cimentación. Un equipo confiable y competente.', 5, 3),
('Ana Torres', 'CEO', 'Desarrollo Urbano Corp', 'Llevamos 5 años trabajando con ALEKSEY y cada proyecto ha sido un éxito. Su compromiso con la calidad y los tiempos de entrega es incomparable.', 5, 4),
('Jorge Ramírez', 'Jefe de Obras', 'Infraestructura Nacional', 'El alquiler de vehículos y maquinaria fue fundamental para nuestro proyecto vial. Equipos modernos, bien mantenidos y con excelente servicio de soporte.', 5, 5);