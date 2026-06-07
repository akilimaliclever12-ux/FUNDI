-- 0007_fix_admin_users_rls.sql
-- Fix: "infinite recursion detected in policy for relation admin_users".
-- The original admin_users_super_all policy queried admin_users inside its own
-- USING clause, which re-triggers policy evaluation -> recursion. Replace it
-- with a SECURITY DEFINER helper that bypasses RLS.

create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.id = uid and a.is_active and a.admin_role = 'super_admin'
  );
$$;

drop policy if exists admin_users_super_all on public.admin_users;

create policy admin_users_super_all on public.admin_users
  for all using (public.is_super_admin(auth.uid()));
