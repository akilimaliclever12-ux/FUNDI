-- 0002_core_tables.sql — core tables
-- All ids uuid, timestamps timestamptz, snake_case. See docs/02-data-dictionary.md

-- USERS (1:1 with auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null,
  phone text unique not null,
  whatsapp_number text,
  email text unique,
  preferred_language text not null default 'fr',
  avatar_url text,
  is_phone_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- PROFESSIONS (reference)
create table public.professions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null,
  name_sw text,
  name_en text,
  description text,
  icon text,
  sort_order int4 not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LOCATIONS (hierarchical reference)
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type location_type not null,
  parent_id uuid references public.locations(id),
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- WORKERS (core public entity)
create table public.workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  profession_id uuid not null references public.professions(id),
  location_id uuid not null references public.locations(id),
  headline text not null,
  bio text,
  years_experience int2 check (years_experience between 0 and 70),
  service_areas text[],
  hourly_rate_min int4,
  hourly_rate_max int4,
  whatsapp_number text not null,
  status worker_status not null default 'pending',
  rejection_reason text,
  rating_avg numeric(2,1) not null default 0,
  rating_count int4 not null default 0,
  lead_count int4 not null default 0,
  is_featured boolean not null default false,
  approved_at timestamptz,
  search_tsv tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- WORKER PHOTOS
create table public.worker_photos (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  cloudinary_public_id text not null,
  url text not null,
  type photo_type not null default 'portfolio',
  caption text,
  width int4,
  height int4,
  sort_order int4 not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  author_user_id uuid references public.users(id) on delete set null,
  author_name text not null,
  author_phone text,
  rating int2 not null check (rating between 1 and 5),
  comment text,
  status review_status not null default 'pending',
  job_request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- one review per (worker, registered author)
create unique index reviews_unique_author
  on public.reviews (worker_id, author_user_id)
  where author_user_id is not null;

-- LEADS (conversion signal)
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  customer_user_id uuid references public.users(id) on delete set null,
  channel lead_channel not null,
  source_page text,
  customer_phone text,
  message text,
  status lead_status not null default 'new',
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- JOB REQUESTS
create table public.job_requests (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid references public.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  profession_id uuid not null references public.professions(id),
  location_id uuid not null references public.locations(id),
  title text not null,
  description text,
  budget_min int4,
  budget_max int4,
  preferred_date date,
  status job_status not null default 'open',
  assigned_worker_id uuid references public.workers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- link reviews -> job_requests (added after job_requests exists)
alter table public.reviews
  add constraint reviews_job_request_fk
  foreign key (job_request_id) references public.job_requests(id) on delete set null;

-- ADMIN USERS
create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  admin_role admin_role not null default 'moderator',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AUDIT LOGS (append-only)
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references public.admin_users(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);
