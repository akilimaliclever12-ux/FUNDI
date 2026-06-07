# Architecture — Fundi (Bukavu)

> Implementation-ready technical architecture. Stack: **Next.js (App Router) + TypeScript + Supabase + Tailwind CSS + Cloudinary + WhatsApp**.
> Driven by: mobile-first, WhatsApp-as-conversion, low/intermittent bandwidth, 30-day MVP. Read alongside `CLAUDE.md` and `docs/02-data-dictionary.md`.

---

## 1. System Overview

```
                 ┌─────────────────────────────────────────────┐
                 │                  Client                      │
                 │  Mobile browser (low-end Android, 3G)        │
                 │  Next.js (mostly Server Components, light JS) │
                 └───────────────┬─────────────────────────────┘
                                 │ HTTPS
            ┌────────────────────┼───────────────────────────┐
            │              Vercel (Next.js)                   │
            │  - SSG/ISR public pages (home, listing, profile)│
            │  - Server Actions + Route Handlers (/api)       │
            │  - Server-only Supabase (service role) usage     │
            └───────┬───────────────────────┬─────────────────┘
                    │                        │
          ┌─────────▼─────────┐    ┌─────────▼──────────┐
          │     Supabase      │    │     Cloudinary      │
          │  Postgres + RLS   │    │  Image upload/CDN   │
          │  Auth (phone OTP) │    │  f_auto,q_auto      │
          │  Storage (priv.)  │    └─────────────────────┘
          └─────────┬─────────┘
                    │
        ┌───────────▼─────────────┐   ┌──────────────────────┐
        │  WhatsApp (wa.me link)  │   │ Resend / GA4 / Pixel  │
        │  → Cloud API later      │   │ Search Console        │
        └─────────────────────────┘   └──────────────────────┘
```

**Rendering strategy (bandwidth-first):**
- **Public pages** → Static Generation + **ISR** (revalidate on data change / time). Served from CDN edge, minimal client JS.
- **Worker/admin dashboards** → dynamic Server Components with per-request auth.
- **Interactivity** (search filters, upload widget, WhatsApp click) → small Client Components only.

---

## 2. Folder Structure

```
fundi-bukavu/
├─ CLAUDE.md
├─ README.md
├─ next.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
├─ .env.local                      # never committed
├─ .env.example                    # documents required keys
├─ docs/                           # foundation docs (this folder)
├─ public/
│  ├─ icons/  manifest.webmanifest  robots.txt
│  └─ og/                          # static OG images
├─ supabase/
│  ├─ migrations/                  # SQL — source of truth for schema
│  │  ├─ 0001_init_enums.sql
│  │  ├─ 0002_core_tables.sql
│  │  ├─ 0003_indexes.sql
│  │  ├─ 0004_rls_policies.sql
│  │  ├─ 0005_triggers.sql
│  │  └─ 0006_functions.sql
│  ├─ seed.sql                     # professions + Bukavu locations
│  └─ config.toml
└─ src/
   ├─ app/
   │  ├─ layout.tsx                # root layout, fonts, providers
   │  ├─ globals.css
   │  ├─ page.tsx                  # Home
   │  ├─ (public)/
   │  │  ├─ workers/
   │  │  │  ├─ page.tsx            # Listing (search/filter)
   │  │  │  └─ [id]/page.tsx       # Worker profile
   │  │  ├─ about/page.tsx
   │  │  └─ contact/page.tsx
   │  ├─ (worker)/
   │  │  ├─ rejoindre/page.tsx     # Worker onboarding (create profile)
   │  │  └─ dashboard/             # (v1.1) self-service
   │  │     ├─ page.tsx
   │  │     └─ photos/page.tsx
   │  ├─ admin/
   │  │  ├─ layout.tsx             # admin guard
   │  │  ├─ page.tsx               # overview
   │  │  ├─ workers/
   │  │  │  ├─ page.tsx            # list + filters (status)
   │  │  │  └─ [id]/page.tsx       # review/approve/edit
   │  │  ├─ reviews/page.tsx       # moderate reviews
   │  │  └─ leads/page.tsx         # analytics
   │  ├─ api/
   │  │  ├─ leads/route.ts         # POST log a lead
   │  │  ├─ workers/route.ts       # POST create profile (also via action)
   │  │  ├─ upload/sign/route.ts   # POST signed Cloudinary upload params
   │  │  ├─ reviews/route.ts       # POST submit review
   │  │  ├─ revalidate/route.ts    # ISR revalidation hook
   │  │  └─ whatsapp/webhook/route.ts  # (v1.1) Cloud API webhook
   │  ├─ sitemap.ts
   │  ├─ robots.ts
   │  └─ not-found.tsx
   ├─ components/
   │  ├─ ui/                       # Button, Input, Card, Badge, Skeleton…
   │  ├─ features/
   │  │  ├─ worker-card.tsx
   │  │  ├─ worker-gallery.tsx
   │  │  ├─ search-bar.tsx
   │  │  ├─ filters.tsx
   │  │  ├─ whatsapp-button.tsx    # client; logs lead then opens wa.me
   │  │  ├─ photo-uploader.tsx     # client; Cloudinary
   │  │  └─ review-form.tsx
   │  └─ layout/                   # Header, Footer, BottomNav
   ├─ lib/
   │  ├─ supabase/
   │  │  ├─ client.ts              # browser (anon)
   │  │  ├─ server.ts              # server component / action (user session)
   │  │  └─ admin.ts               # service-role (server-only, never imported client)
   │  ├─ cloudinary.ts             # sign params, url builders
   │  ├─ whatsapp.ts               # buildWaLink(number, message)
   │  ├─ validations/              # Zod schemas (worker, review, lead, contact)
   │  ├─ queries/                  # typed data-access fns (getWorkers, getWorker…)
   │  ├─ rate-limit.ts
   │  ├─ analytics.ts              # event helpers (deferred load)
   │  └─ utils.ts
   ├─ types/
   │  ├─ database.types.ts         # generated from Supabase
   │  └─ index.ts                  # app-level types
   └─ styles/ (if needed)
```

---

## 3. Database Schema (SQL — Supabase migrations)

Full field list is in `docs/02-data-dictionary.md`. This is the implementation-ready DDL skeleton.

### 0001 — Enums
```sql
create type user_role     as enum ('customer','worker');
create type worker_status as enum ('pending','approved','rejected','suspended');
create type location_type as enum ('city','commune','quartier');
create type review_status as enum ('pending','published','rejected');
create type photo_type    as enum ('portfolio','avatar','verification');
create type lead_channel  as enum ('whatsapp','call','form');
create type lead_status   as enum ('new','contacted','converted','lost');
create type job_status    as enum ('open','assigned','closed','cancelled');
create type admin_role    as enum ('super_admin','moderator','support');
```

### 0002 — Core tables (abridged; see data dictionary for all columns)
```sql
-- shared trigger helper added in 0005
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

create table public.professions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null, name_sw text, name_en text,
  description text, icon text,
  sort_order int4 default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type location_type not null,
  parent_id uuid references public.locations(id),
  latitude numeric(9,6), longitude numeric(9,6),
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  profession_id uuid not null references public.professions(id),
  location_id uuid not null references public.locations(id),
  headline text not null,
  bio text,
  years_experience int2 check (years_experience between 0 and 70),
  service_areas text[],
  hourly_rate_min int4, hourly_rate_max int4,
  whatsapp_number text not null,
  status worker_status not null default 'pending',
  rejection_reason text,
  rating_avg numeric(2,1) default 0,
  rating_count int4 default 0,
  lead_count int4 default 0,
  is_featured boolean default false,
  approved_at timestamptz,
  search_tsv tsvector,                      -- maintained by trigger
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.worker_photos ( ... );   -- see data dictionary
create table public.reviews      ( ... );
create table public.leads        ( ... );
create table public.job_requests ( ... );
create table public.admin_users  ( ... );
create table public.audit_logs   ( ... );    -- append-only
```

### 0003 — Indexes (search/filter performance)
```sql
create index workers_filter_idx on public.workers (status, profession_id, location_id);
create index workers_rating_idx on public.workers (rating_avg desc);
create index workers_featured_idx on public.workers (is_featured desc, approved_at desc);
create index workers_search_idx on public.workers using gin (search_tsv);
create index workers_areas_idx on public.workers using gin (service_areas);
create index reviews_worker_idx on public.reviews (worker_id, status);
create index leads_worker_time_idx on public.leads (worker_id, created_at desc);
create index audit_entity_idx on public.audit_logs (entity_type, entity_id);
```

### 0006 — Helper functions
```sql
-- used by RLS to grant admin access without recursive policy lookups
create or replace function public.is_admin(uid uuid)
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.admin_users a where a.id = uid and a.is_active);
$$;
```

### 0004 — RLS policies (default deny; explicit allow)
```sql
alter table public.workers enable row level security;

-- Public can read ONLY approved, non-deleted workers
create policy workers_public_read on public.workers
  for select using (status = 'approved' and deleted_at is null);

-- A worker can read/update their OWN row (any status)
create policy workers_owner_rw on public.workers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Admins full access
create policy workers_admin_all on public.workers
  for all using (public.is_admin(auth.uid()));
```
Apply the same pattern to every table: enable RLS, default deny, then explicit `public_read` (only where appropriate), `owner`, and `is_admin()` policies. `audit_logs` allows INSERT + admin SELECT only — **no UPDATE/DELETE** (also revoke those grants).

### 0005 — Triggers
- `set_updated_at()` BEFORE UPDATE on all tables.
- `workers_search_tsv()` to maintain `search_tsv = to_tsvector('simple', coalesce(headline,'')||' '||coalesce(bio,''))`.
- `recompute_worker_rating()` AFTER INSERT/UPDATE/DELETE on `reviews` (where status='published') → updates `rating_avg`, `rating_count`.
- `bump_lead_count()` AFTER INSERT on `leads` → `workers.lead_count += 1`.
- `audit_worker_changes()` AFTER UPDATE/DELETE on `workers` → write `audit_logs`.

**Type generation:** `supabase gen types typescript` → `src/types/database.types.ts`, committed and kept in sync.

---

## 4. API Routes & Server Actions

Prefer **Server Actions** for form mutations (progressive enhancement, less client JS). Use **Route Handlers** for things needing a public HTTP endpoint (lead beacons, webhooks, signed uploads, revalidation).

| Method & Path | Auth | Purpose | Notes |
|---------------|------|---------|-------|
| `GET /` (page) | public | Home + search entry | SSG/ISR |
| `GET /workers` (page) | public | Listing w/ `?profession=&location=&q=&page=` | ISR; server-side filtered query |
| `GET /workers/[id]` (page) | public | Profile | ISR; only `approved` resolvable |
| `POST /api/leads` | public (rate-limited) | Log a lead on WhatsApp/call click | Body: workerId, channel, source. Returns 204; fire-and-forget beacon. |
| `POST /api/upload/sign` | worker/admin | Return signed Cloudinary params | Never expose API secret; sign server-side. |
| **Action** `createWorkerProfile` | worker | Create profile (status=pending) | Zod-validated; inserts worker + photos meta. |
| **Action** `updateWorkerProfile` | worker (owner) | Edit own profile | Re-validates; may reset to pending on major change. |
| `POST /api/reviews` | public (rate-limited) | Submit review (status=pending) | Anti-spam: phone + ip_hash throttle. |
| **Action** `adminModerateWorker` | admin | approve / reject / suspend / edit / delete | Writes `audit_logs`; triggers revalidate. |
| **Action** `adminModerateReview` | admin | publish / reject review | Recomputes rating. |
| `POST /api/revalidate` | internal (secret) | ISR revalidate listing/profile | Called after admin moderation. |
| `GET /api/whatsapp/webhook` | Meta (verify token) | (v1.1) Cloud API verification | |
| `POST /api/whatsapp/webhook` | Meta (signature) | (v1.1) inbound/status events | Verify `X-Hub-Signature-256`. |
| `GET /sitemap.xml`, `/robots.txt` | public | SEO | Generated. |

**WhatsApp contact flow (MVP):** `WhatsAppButton` (client) → `navigator.sendBeacon('/api/leads', {...})` → then `window.location = buildWaLink(number, prefilledMsg)`. Lead logging must not block the redirect.

---

## 5. Authentication Strategy

- **Provider:** Supabase Auth.
- **Workers:** **phone-first OTP** (SMS/WhatsApp OTP) — most have no email. On first OTP success, create the `users` row (`role='worker'`) and start onboarding. Email optional.
- **Customers:** **no account required** to browse or contact (lowers friction = the whole point). Optional account later for reviews/favorites.
- **Admins:** Supabase auth (email+password or magic link) **gated by membership in `admin_users`**. Being in `auth.users` is not enough; `is_admin()` must return true.
- **Sessions:** Supabase SSR cookies via `@supabase/ssr`. Three clients:
  - `client.ts` (browser, anon key, RLS-bound),
  - `server.ts` (per-request user session in Server Components/Actions),
  - `admin.ts` (**service-role, server-only**, used only in trusted mutations like moderation/audit; never imported into a Client Component).
- **Authorization:** enforced primarily by **RLS** (DB is the security boundary), with route/layout guards in the app as a second layer. `admin/layout.tsx` redirects non-admins.
- **OTP delivery:** start with Supabase's phone auth (Twilio or a configured SMS provider with DRC coverage); evaluate WhatsApp OTP. Rate-limit OTP requests.

---

## 6. Admin Dashboard Requirements

Route group `/admin`, protected by `is_admin()` + layout guard. Functional requirements:

1. **Overview** — counts: pending workers, total approved, leads (7/30 days), pending reviews, new signups. Fast, cached.
2. **Worker moderation** (core):
   - Queue of `pending` workers (oldest first) with photos, bio, verification photos, profession, location.
   - Actions: **Approve / Reject (with reason) / Edit / Suspend / Delete (soft)**.
   - Every action writes to `audit_logs` and triggers ISR revalidation of public pages.
   - Search/filter by status, profession, location, name.
3. **Review moderation** — publish/reject; see worker context; bulk actions.
4. **Leads / analytics** — table + simple charts (leads per worker, top professions/areas, conversion). Export CSV.
5. **Reference data** — manage `professions` and `locations` (add/disable, sort order).
6. **Admin users** (super_admin only) — invite/disable moderators; role management.
7. **Audit log viewer** — filter by entity/admin/date; read-only.

**Non-functional:** desktop-first but responsive (admins may use phones); minimal heavy JS; all destructive actions confirm + are audited; optimistic UI acceptable but server-verified.

---

## 7. Security Considerations

- **RLS on every table, default deny.** DB is the trust boundary; never rely on UI checks alone.
- **Public exposure = `approved` workers only.** `pending/rejected/suspended` and `verification` photos are admin-only by policy.
- **Service-role key is server-only** — isolated in `lib/supabase/admin.ts`, never bundled to client (enforce with an import lint rule / no `NEXT_PUBLIC_` prefix).
- **Input validation with Zod** at every boundary (actions, route handlers). Reject unknown fields.
- **Ownership checks** use `auth.uid()`; never trust client-supplied ids for write authorization.
- **Rate limiting** on `/api/leads`, `/api/reviews`, OTP, and contact form (IP-hash + sliding window; Upstash at scale). Store `ip_hash` (sha256 + salt), never raw IPs.
- **Phone privacy:** worker WhatsApp number revealed on intent (click) and logged as a lead; consider obfuscation to deter scraping; throttle.
- **Cloudinary uploads signed server-side**, with type/size/dimension limits; only store metadata in DB; moderate before public display.
- **Audit logging** for all admin mutations (append-only `audit_logs`).
- **Secrets** only in env (Vercel/Supabase); `.env.example` documents names; rotate on exposure.
- **Headers:** CSP, HSTS, `X-Content-Type-Options`, referrer policy via `next.config`/middleware.
- **Webhook security (v1.1):** verify Meta `X-Hub-Signature-256` and the verify token.
- **Abuse:** CAPTCHA (hCaptcha/Turnstile) on review/contact if spam appears; honeypot fields.

---

## 8. Hosting Recommendations

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend / SSR / API** | **Vercel** | First-class Next.js, global CDN edge, ISR, easy previews per PR. Pick a region close to users (EU — e.g. `fra1`/Paris — has good latency to Central Africa; test against an Africa edge if available). |
| **Database / Auth / Storage** | **Supabase** | Managed Postgres + RLS + Auth + Storage; choose the region nearest users (EU-West) to cut latency. |
| **Images / CDN** | **Cloudinary** | Global CDN, `f_auto,q_auto`, on-the-fly responsive transforms — essential for low bandwidth. |
| **Email** | **Resend** | Transactional, simple. |
| **DNS / domain** | Registrar + Vercel DNS | `.cd` domain if feasible for local trust, plus `.com`. |
| **Monitoring** | Sentry + Vercel Analytics | Error + perf visibility (feeds `06-journal-erreurs.md`). |

**Edge note:** Prioritize aggressive CDN caching (ISR + Cloudinary) so most page loads are served from the edge, minimizing round-trips to EU-hosted origin — this matters more than origin region for perceived speed in Bukavu.

---

## 9. Estimated Monthly Costs

| Stage | Services | Approx. USD/mo |
|-------|----------|----------------|
| **MVP / Launch** | Vercel Hobby (or Pro $20), Supabase Free, Cloudinary Free, Resend Free, WhatsApp deep links (free), GA4/Pixel/Search Console (free) | **$0 – 20** |
| **Early growth** | Vercel Pro $20, Supabase Pro $25, Cloudinary (free→light paid), Sentry free | **$45 – 90** |
| **Scale** | Supabase Pro+ compute, Cloudinary paid (~$89+), WhatsApp Cloud API (usage), Upstash, payments fees | **$150 – 400+** |

Domain ~$10–40/yr separate. SMS OTP is pay-per-message (budget separately based on signup volume). See `docs/05-integrations.md` for the full breakdown and env-var checklist.

---

## 10. Implementation Order (maps to MVP backlog)

1. **Scaffold** Next.js + TS + Tailwind (gradient theme tokens) + Supabase clients + envs.
2. **Migrations 0001–0006** + `seed.sql` (professions, Bukavu locations) + generate types.
3. **Public read path:** listing + filters + profile (SSG/ISR) reading approved workers.
4. **WhatsApp button + `/api/leads`** (the conversion).
5. **Auth (phone OTP)** + **worker onboarding** + **Cloudinary signed upload**.
6. **Admin dashboard:** moderation queue + approve/reject/edit/delete + audit + revalidate.
7. **Reviews** (read, then moderated submit).
8. **SEO** (sitemap, metadata, Search Console) + **analytics** (deferred) + perf pass.
9. **Tests:** RLS visibility, lead creation, search, golden-path E2E. Launch.

---

### Architecture summary
Static-first public pages on Vercel + Cloudinary CDN for speed on slow networks; Supabase Postgres with **RLS as the security boundary** (approved-only public); phone-OTP auth for workers, no-account browsing for customers; WhatsApp deep links as the conversion with server-side lead logging; a guarded, audited admin dashboard for moderation. Lean enough to launch in 30 days, structured to grow into the v2.0 marketplace.
