drop policy if exists "auth read templates" on public.inspection_templates;
create policy "staff read templates" on public.inspection_templates
for select to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role_text(auth.uid(), 'editor')
  or has_role_text(auth.uid(), 'viewer')
  or has_role_text(auth.uid(), 'operator')
);

drop policy if exists "auth read tpl items" on public.inspection_template_items;
create policy "staff read tpl items" on public.inspection_template_items
for select to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role_text(auth.uid(), 'editor')
  or has_role_text(auth.uid(), 'viewer')
  or has_role_text(auth.uid(), 'operator')
);

drop policy if exists "Authenticated read sla_policies" on public.sla_policies;
create policy "Staff read sla_policies" on public.sla_policies
for select to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role_text(auth.uid(), 'editor')
  or has_role_text(auth.uid(), 'viewer')
);

drop policy if exists "Staff read job applications" on public.job_applications;
create policy "Staff read job applications" on public.job_applications
for select to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role_text(auth.uid(), 'editor')
);

create or replace function public.validate_referral_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  if new.code_used is null then
    raise exception 'Se requiere un codigo de referido valido';
  end if;

  select user_id into owner from public.referral_codes where code = new.code_used;
  if owner is null then
    raise exception 'Codigo de referido invalido';
  end if;

  new.referrer_user_id := owner;
  new.referred_user_id := auth.uid();
  new.reward_note := null;
  new.converted_at := null;
  return new;
end;
$$;

drop trigger if exists trg_validate_referral_insert on public.referrals;
create trigger trg_validate_referral_insert
before insert on public.referrals
for each row execute function public.validate_referral_insert();