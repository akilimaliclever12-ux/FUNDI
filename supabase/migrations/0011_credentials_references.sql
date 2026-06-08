-- 0011_credentials_references.sql
-- Extra fundi profile sections: credentials (certifications / diplomas /
-- service attestations) and reference persons (contact is PRIVATE).
-- Run in Supabase SQL Editor.

do $$ begin
  create type credential_type as enum ('certification', 'diploma', 'attestation');
exception when duplicate_object then null; end $$;

-- CREDENTIALS — uploaded documents, shown publicly on approved profiles.
create table if not exists public.worker_credentials (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  type credential_type not null,
  title text not null,
  storage_path text not null,
  url text not null,
  created_at timestamptz not null default now()
);
create index if not exists worker_credentials_worker_idx on public.worker_credentials (worker_id);

alter table public.worker_credentials enable row level security;

drop policy if exists worker_credentials_public_read on public.worker_credentials;
create policy worker_credentials_public_read on public.worker_credentials
  for select using (
    exists (select 1 from public.workers w
            where w.id = worker_credentials.worker_id
              and w.status = 'approved' and w.deleted_at is null)
  );
drop policy if exists worker_credentials_owner_all on public.worker_credentials;
create policy worker_credentials_owner_all on public.worker_credentials
  for all using (
    exists (select 1 from public.workers w where w.id = worker_credentials.worker_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workers w where w.id = worker_credentials.worker_id and w.user_id = auth.uid())
  );
drop policy if exists worker_credentials_admin_all on public.worker_credentials;
create policy worker_credentials_admin_all on public.worker_credentials
  for all using (public.is_admin(auth.uid()));

-- REFERENCES — name + position are public; CONTACT is private (owner + admin
-- only). We achieve this by NOT granting public SELECT; the public profile page
-- reads name/position via the service role and never exposes the contact.
create table if not exists public.worker_references (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  name text not null,
  position text,
  contact text not null,
  created_at timestamptz not null default now()
);
create index if not exists worker_references_worker_idx on public.worker_references (worker_id);

alter table public.worker_references enable row level security;

drop policy if exists worker_references_owner_all on public.worker_references;
create policy worker_references_owner_all on public.worker_references
  for all using (
    exists (select 1 from public.workers w where w.id = worker_references.worker_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workers w where w.id = worker_references.worker_id and w.user_id = auth.uid())
  );
drop policy if exists worker_references_admin_all on public.worker_references;
create policy worker_references_admin_all on public.worker_references
  for all using (public.is_admin(auth.uid()));
-- (no public SELECT policy — contact stays private)

notify pgrst, 'reload schema';
