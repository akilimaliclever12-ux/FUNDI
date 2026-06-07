-- 0004_functions.sql — helper functions used by RLS and triggers

-- Is the given auth uid an active admin? SECURITY DEFINER to avoid recursive RLS.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.id = uid and a.is_active
  );
$$;

-- Is the given auth uid an active SUPER admin? SECURITY DEFINER (bypasses RLS,
-- so policies on admin_users that call this do NOT recurse).
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

-- Maintain updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Maintain workers.search_tsv from headline + bio
create or replace function public.workers_set_search_tsv()
returns trigger
language plpgsql
as $$
begin
  new.search_tsv =
    to_tsvector('simple', coalesce(new.headline, '') || ' ' || coalesce(new.bio, ''));
  return new;
end;
$$;

-- Recompute cached rating aggregates for a worker
create or replace function public.recompute_worker_rating()
returns trigger
language plpgsql
as $$
declare
  wid uuid;
begin
  wid = coalesce(new.worker_id, old.worker_id);
  update public.workers w
  set rating_avg = coalesce((
        select round(avg(r.rating)::numeric, 1)
        from public.reviews r
        where r.worker_id = wid and r.status = 'published' and r.deleted_at is null
      ), 0),
      rating_count = (
        select count(*)
        from public.reviews r
        where r.worker_id = wid and r.status = 'published' and r.deleted_at is null
      )
  where w.id = wid;
  return null;
end;
$$;

-- Bump lead_count on new lead
create or replace function public.bump_lead_count()
returns trigger
language plpgsql
as $$
begin
  update public.workers set lead_count = lead_count + 1 where id = new.worker_id;
  return null;
end;
$$;
