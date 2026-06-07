-- 0006_rls_policies.sql — Row Level Security. Default deny; explicit allow.
-- DB is the security boundary. Public sees only approved workers.

-- Enable RLS everywhere
alter table public.users         enable row level security;
alter table public.professions   enable row level security;
alter table public.locations     enable row level security;
alter table public.workers       enable row level security;
alter table public.worker_photos enable row level security;
alter table public.reviews       enable row level security;
alter table public.leads         enable row level security;
alter table public.job_requests  enable row level security;
alter table public.admin_users   enable row level security;
alter table public.audit_logs    enable row level security;

-- ---------- USERS ----------
create policy users_self_rw on public.users
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy users_admin_all on public.users
  for all using (public.is_admin(auth.uid()));

-- ---------- PROFESSIONS (public read of active) ----------
create policy professions_public_read on public.professions
  for select using (is_active = true);
create policy professions_admin_all on public.professions
  for all using (public.is_admin(auth.uid()));

-- ---------- LOCATIONS (public read of active) ----------
create policy locations_public_read on public.locations
  for select using (is_active = true);
create policy locations_admin_all on public.locations
  for all using (public.is_admin(auth.uid()));

-- ---------- WORKERS ----------
-- public can read only approved, non-deleted
create policy workers_public_read on public.workers
  for select using (status = 'approved' and deleted_at is null);
-- owner can read & write own row (any status)
create policy workers_owner_select on public.workers
  for select using (user_id = auth.uid());
create policy workers_owner_insert on public.workers
  for insert with check (user_id = auth.uid());
create policy workers_owner_update on public.workers
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- admins full access
create policy workers_admin_all on public.workers
  for all using (public.is_admin(auth.uid()));

-- ---------- WORKER PHOTOS ----------
-- public can read portfolio/avatar photos of APPROVED workers (not verification)
create policy worker_photos_public_read on public.worker_photos
  for select using (
    deleted_at is null
    and type in ('portfolio', 'avatar')
    and exists (
      select 1 from public.workers w
      where w.id = worker_photos.worker_id
        and w.status = 'approved' and w.deleted_at is null
    )
  );
-- owner manages own photos
create policy worker_photos_owner_all on public.worker_photos
  for all using (
    exists (select 1 from public.workers w where w.id = worker_photos.worker_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workers w where w.id = worker_photos.worker_id and w.user_id = auth.uid())
  );
create policy worker_photos_admin_all on public.worker_photos
  for all using (public.is_admin(auth.uid()));

-- ---------- REVIEWS ----------
-- public reads only published reviews of approved workers
create policy reviews_public_read on public.reviews
  for select using (
    status = 'published' and deleted_at is null
    and exists (select 1 from public.workers w where w.id = reviews.worker_id and w.status = 'approved')
  );
-- anyone (anon or authed) can submit a review (lands as pending)
create policy reviews_insert_any on public.reviews
  for insert with check (status = 'pending');
-- author can read own reviews
create policy reviews_author_read on public.reviews
  for select using (author_user_id = auth.uid());
create policy reviews_admin_all on public.reviews
  for all using (public.is_admin(auth.uid()));

-- ---------- LEADS ----------
-- anyone can insert a lead (contact intent)
create policy leads_insert_any on public.leads
  for insert with check (true);
-- worker can read leads for their own profile
create policy leads_worker_read on public.leads
  for select using (
    exists (select 1 from public.workers w where w.id = leads.worker_id and w.user_id = auth.uid())
  );
create policy leads_admin_all on public.leads
  for all using (public.is_admin(auth.uid()));

-- ---------- JOB REQUESTS ----------
create policy job_requests_insert_any on public.job_requests
  for insert with check (true);
create policy job_requests_owner_read on public.job_requests
  for select using (customer_user_id = auth.uid());
create policy job_requests_admin_all on public.job_requests
  for all using (public.is_admin(auth.uid()));

-- ---------- ADMIN USERS ----------
create policy admin_users_self_read on public.admin_users
  for select using (id = auth.uid());
-- Use SECURITY DEFINER helper to avoid infinite recursion (policy must not
-- query admin_users directly).
create policy admin_users_super_all on public.admin_users
  for all using (public.is_super_admin(auth.uid()));

-- ---------- AUDIT LOGS (append-only) ----------
-- only admins can read; inserts allowed via service role / admin; no update/delete policy = denied
create policy audit_admin_read on public.audit_logs
  for select using (public.is_admin(auth.uid()));
create policy audit_admin_insert on public.audit_logs
  for insert with check (public.is_admin(auth.uid()));
