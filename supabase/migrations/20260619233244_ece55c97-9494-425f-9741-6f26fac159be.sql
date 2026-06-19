
-- Bookings/availability for machinery & vehicles
CREATE TABLE public.equipment_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('machinery','vehicle')),
  equipment_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','blocked','completed','cancelled')),
  customer_name TEXT,
  customer_email TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

GRANT SELECT ON public.equipment_bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_bookings TO authenticated;
GRANT ALL ON public.equipment_bookings TO service_role;

ALTER TABLE public.equipment_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookings are publicly viewable for availability"
  ON public.equipment_bookings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage all bookings"
  ON public.equipment_bookings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_bookings_equipment ON public.equipment_bookings(equipment_type, equipment_id, start_date, end_date);

CREATE TRIGGER update_equipment_bookings_updated_at
  BEFORE UPDATE ON public.equipment_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-request chat replies (admin ↔ customer)
CREATE TABLE public.message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  author_id UUID,
  author_role TEXT NOT NULL CHECK (author_role IN ('admin','customer')),
  author_name TEXT,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  read_by_customer BOOLEAN NOT NULL DEFAULT false,
  read_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.message_replies TO authenticated;
GRANT ALL ON public.message_replies TO service_role;

ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all replies"
  ON public.message_replies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers view replies on their own messages"
  ON public.message_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contact_messages cm
      WHERE cm.id = message_replies.message_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers reply to their own messages"
  ON public.message_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    author_role = 'customer'
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.contact_messages cm
      WHERE cm.id = message_replies.message_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE INDEX idx_replies_message ON public.message_replies(message_id, created_at);
