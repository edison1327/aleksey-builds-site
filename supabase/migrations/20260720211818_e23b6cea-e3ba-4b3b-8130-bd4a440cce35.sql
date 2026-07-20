
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  module TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT false,
  scope TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, module)
);

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_permissions readable by authenticated" ON public.role_permissions;
CREATE POLICY "role_permissions readable by authenticated"
  ON public.role_permissions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "role_permissions admin manage" ON public.role_permissions;
CREATE POLICY "role_permissions admin manage"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS role_permissions_touch ON public.role_permissions;
CREATE TRIGGER role_permissions_touch
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _module TEXT, _action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ok BOOLEAN := false;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF public.has_role(_user_id, 'admin') THEN RETURN true; END IF;
  SELECT bool_or(
    CASE _action
      WHEN 'view'    THEN rp.can_view
      WHEN 'create'  THEN rp.can_create
      WHEN 'edit'    THEN rp.can_edit
      WHEN 'delete'  THEN rp.can_delete
      WHEN 'approve' THEN rp.can_approve
      ELSE false
    END
  ) INTO _ok
  FROM public.role_permissions rp
  JOIN public.user_roles ur ON ur.role = rp.role
  WHERE ur.user_id = _user_id AND rp.module = _module;
  RETURN COALESCE(_ok, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_branch_access(_user_id UUID, _branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL AND (
      public.has_role(_user_id, 'admin')
      OR _branch_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.user_branches ub
        WHERE ub.user_id = _user_id AND ub.branch_id = _branch_id
      )
      OR NOT EXISTS (SELECT 1 FROM public.user_branches ub WHERE ub.user_id = _user_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_branches(_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(branch_id), ARRAY[]::UUID[])
  FROM public.user_branches WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'manager'::public.app_role);
$$;

REVOKE EXECUTE ON FUNCTION public.has_permission(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_branch_access(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_branches(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_branch_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_branches(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(UUID) TO authenticated;

INSERT INTO public.role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, scope) VALUES
('admin','contenido_cms',true,true,true,true,true,'all'),
('admin','usuarios',true,true,true,true,true,'all'),
('admin','sucursales',true,true,true,true,true,'all'),
('admin','work_orders',true,true,true,true,true,'all'),
('admin','inspecciones',true,true,true,true,true,'all'),
('admin','facturas',true,true,true,true,true,'all'),
('admin','compras',true,true,true,true,true,'all'),
('admin','rfqs',true,true,true,true,true,'all'),
('admin','proveedores',true,true,true,true,true,'all'),
('admin','contratos',true,true,true,true,true,'all'),
('admin','documentos',true,true,true,true,true,'all'),
('admin','rrhh',true,true,true,true,true,'all'),
('admin','reportes',true,true,true,true,true,'all'),
('admin','portal_cliente',true,true,true,true,true,'all'),
('admin','portal_proveedor',true,true,true,true,true,'all'),
('manager','contenido_cms',true,false,false,false,false,'all'),
('manager','usuarios',true,true,true,false,false,'all'),
('manager','sucursales',true,false,false,false,false,'branch'),
('manager','work_orders',true,true,true,true,true,'branch'),
('manager','inspecciones',true,false,false,false,true,'branch'),
('manager','facturas',true,true,true,false,true,'branch'),
('manager','compras',true,true,true,true,true,'branch'),
('manager','rfqs',true,true,true,false,true,'branch'),
('manager','proveedores',true,true,true,false,false,'branch'),
('manager','contratos',true,true,true,false,true,'branch'),
('manager','documentos',true,true,true,false,false,'branch'),
('manager','rrhh',true,true,true,false,true,'branch'),
('manager','reportes',true,false,false,false,false,'branch'),
('editor','contenido_cms',true,true,true,true,false,'all'),
('viewer','contenido_cms',true,false,false,false,false,'all'),
('viewer','work_orders',true,false,false,false,false,'branch'),
('viewer','facturas',true,false,false,false,false,'branch'),
('viewer','reportes',true,false,false,false,false,'branch'),
('operator','work_orders',true,false,true,false,false,'branch'),
('operator','inspecciones',true,true,true,false,false,'branch'),
('operator','documentos',true,false,false,false,false,'branch'),
('operator','compras',true,false,false,false,false,'branch'),
('supplier','rfqs',true,false,true,false,false,'own'),
('supplier','proveedores',true,false,true,false,false,'own'),
('supplier','portal_proveedor',true,true,true,false,false,'own'),
('client','facturas',true,false,false,false,false,'own'),
('client','contratos',true,false,true,false,false,'own'),
('client','documentos',true,false,false,false,false,'own'),
('client','work_orders',true,false,false,false,false,'own'),
('client','portal_cliente',true,true,true,false,false,'own')
ON CONFLICT (role, module) DO NOTHING;
