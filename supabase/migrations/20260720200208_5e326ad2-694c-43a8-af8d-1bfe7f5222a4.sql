
-- ============ WAVE BH: Internal Chat ============
CREATE TABLE public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('general','project','work_order','direct')),
  reference_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_channels TO service_role;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_channel_members TO authenticated;
GRANT ALL ON public.chat_channel_members TO service_role;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_chat_channel_members_user ON public.chat_channel_members(user_id);

-- Security definer to avoid recursion
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE channel_id = _channel_id AND user_id = _user_id
  )
$$;

CREATE POLICY "Members can view their channels" ON public.chat_channels
  FOR SELECT TO authenticated
  USING (NOT is_private OR public.is_channel_member(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Authenticated can create channels" ON public.chat_channels
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator or admin update channel" ON public.chat_channels
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Creator or admin delete channel" ON public.chat_channels
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Members see membership" ON public.chat_channel_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_channel_member(channel_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users can join channels" ON public.chat_channel_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users manage own membership" ON public.chat_channel_members
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users leave channels" ON public.chat_channel_members
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Members read messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.is_channel_member(channel_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Members send messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_channel_member(channel_id, auth.uid()));

CREATE POLICY "Author edits own messages" ON public.chat_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Author or admin deletes messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_members;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- ============ WAVE BJ: Public Status Portal ============
CREATE TABLE public.status_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational','degraded','partial_outage','major_outage','maintenance')),
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.status_components TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.status_components TO authenticated;
GRANT ALL ON public.status_components TO service_role;
ALTER TABLE public.status_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads visible components" ON public.status_components
  FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins manage components" ON public.status_components
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.status_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','major','critical','maintenance')),
  status text NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating','identified','monitoring','resolved','scheduled','in_progress','completed')),
  affected_components uuid[] DEFAULT '{}',
  is_scheduled boolean NOT NULL DEFAULT false,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  resolved_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.status_incidents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.status_incidents TO authenticated;
GRANT ALL ON public.status_incidents TO service_role;
ALTER TABLE public.status_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads incidents" ON public.status_incidents FOR SELECT USING (true);
CREATE POLICY "Admins manage incidents" ON public.status_incidents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.status_incident_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.status_incidents(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.status_incident_updates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.status_incident_updates TO authenticated;
GRANT ALL ON public.status_incident_updates TO service_role;
ALTER TABLE public.status_incident_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads incident updates" ON public.status_incident_updates FOR SELECT USING (true);
CREATE POLICY "Admins manage incident updates" ON public.status_incident_updates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_status_incidents_created ON public.status_incidents(created_at DESC);
CREATE INDEX idx_status_incident_updates_incident ON public.status_incident_updates(incident_id, created_at DESC);

CREATE TRIGGER update_chat_channels_updated_at BEFORE UPDATE ON public.chat_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_status_components_updated_at BEFORE UPDATE ON public.status_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_status_incidents_updated_at BEFORE UPDATE ON public.status_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
