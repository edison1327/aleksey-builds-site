-- 1) Restrict public contact message inserts
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sanitize_public_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'editor')
  THEN
    RETURN NEW;
  END IF;

  NEW.assigned_to := NULL;
  NEW.crm_stage := 'new'::crm_stage;
  NEW.crm_value_pen := NULL;
  NEW.crm_next_action := NULL;
  NEW.crm_next_action_at := NULL;
  NEW.crm_notes := NULL;
  NEW.crm_order := 0;
  NEW.crm_stage_updated_at := NULL;
  NEW.lead_score := 0;
  NEW.segment := NULL;
  NEW.status := 'pending';
  NEW.is_read := false;
  NEW.deleted_at := NULL;
  NEW.sla_policy_id := NULL;
  NEW.sla_first_response_due := NULL;
  NEW.sla_resolution_due := NULL;
  NEW.sla_first_response_at := NULL;
  NEW.sla_breached := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS a_sanitize_public_contact_message ON public.contact_messages;
CREATE TRIGGER a_sanitize_public_contact_message
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_public_contact_message();

-- 2) Restrict RBAC matrix visibility
DROP POLICY IF EXISTS "role_permissions readable by authenticated" ON public.role_permissions;
CREATE POLICY "role_permissions readable by own roles"
ON public.role_permissions FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = role_permissions.role
  )
);