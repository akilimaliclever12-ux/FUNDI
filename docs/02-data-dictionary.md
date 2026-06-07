# Data Dictionary — Fundi

> Target database: **PostgreSQL (Supabase)**. All tables live in the `public` schema unless noted.
> Conventions: `snake_case` names, plural table names, `uuid` primary keys (default `gen_random_uuid()`), `timestamptz` for time, soft-delete via `deleted_at` where useful, Row Level Security (RLS) enabled on every table.

## Conventions & shared columns

Most tables include:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Surrogate primary key. |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Row creation time. |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update (maintained by trigger). |
| `deleted_at` | `timestamptz` | NULL | Soft-delete marker (NULL = active). |

---

## 1. `users`

**Description:** All authenticated accounts (customers and workers). Mirrors/extends Supabase `auth.users` via a `1:1` profile row keyed by the auth UID. Admins live in a separate `admin_users` table for least-privilege separation.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK, FK → `auth.users.id` | Same id as Supabase auth user. |
| `role` | `user_role` (enum: `customer`, `worker`) | NOT NULL, default `customer` | Account type. |
| `full_name` | `text` | NOT NULL | Display name. |
| `phone` | `text` | UNIQUE, NOT NULL | E.164 format, e.g. `+243970000000`. Primary identity in DRC. |
| `whatsapp_number` | `text` | NULL | If different from `phone`. |
| `email` | `text` | UNIQUE, NULL | Optional; many users have no email. |
| `preferred_language` | `text` | default `fr` | `fr`, `sw`, `en`. |
| `avatar_url` | `text` | NULL | Cloudinary URL. |
| `is_phone_verified` | `boolean` | NOT NULL, default `false` | OTP-verified. |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | see conventions | |

**Relationships:** `1:1` with `auth.users`; `1:1` with `workers` (when role=worker); `1:N` to `reviews` (as author); `1:N` to `job_requests` (as customer).

**Example values:**
```
id: 9f1c...  role: worker  full_name: "Jean Mukwege"  phone: "+243971234567"
whatsapp_number: "+243971234567"  email: null  preferred_language: "fr"
is_phone_verified: true
```

---

## 2. `workers`

**Description:** Public-facing professional profile for a tradesperson. One row per worker user. This is the core entity customers browse.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK | Worker profile id. |
| `user_id` | `uuid` | FK → `users.id`, UNIQUE, NOT NULL | Owning account. |
| `profession_id` | `uuid` | FK → `professions.id`, NOT NULL | Primary trade. |
| `location_id` | `uuid` | FK → `locations.id`, NOT NULL | Base neighborhood. |
| `headline` | `text` | NOT NULL | Short pitch, e.g. "Électricien certifié, 8 ans d'expérience." |
| `bio` | `text` | NULL | Longer description. |
| `years_experience` | `int2` | CHECK (`>= 0 AND <= 70`) | Years in trade. |
| `service_areas` | `text[]` | NULL | Neighborhoods served (denormalized for search). |
| `hourly_rate_min` | `int4` | NULL | In CDF (Congolese Francs). |
| `hourly_rate_max` | `int4` | NULL | In CDF. |
| `whatsapp_number` | `text` | NOT NULL | Contact point (the conversion action). |
| `status` | `worker_status` (enum: `pending`, `approved`, `rejected`, `suspended`) | NOT NULL, default `pending` | Moderation state. Only `approved` are public. |
| `rejection_reason` | `text` | NULL | Set by admin when rejected. |
| `rating_avg` | `numeric(2,1)` | default `0` | Cached average (0.0–5.0). |
| `rating_count` | `int4` | default `0` | Cached number of reviews. |
| `lead_count` | `int4` | default `0` | Total leads received (analytics). |
| `is_featured` | `boolean` | default `false` | Paid/curated promotion. |
| `approved_at` | `timestamptz` | NULL | When approved. |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | | |

**Relationships:** `N:1` to `users`, `professions`, `locations`; `1:N` to `worker_photos`, `reviews`, `leads`. (Optional future: `N:M` to `professions` via a join table if workers have multiple trades.)

**Example values:**
```
id: a12...  user_id: 9f1c...  profession_id: <electrician>  location_id: <ibanda>
headline: "Électricien certifié — installations & dépannage"
years_experience: 8  hourly_rate_min: 5000  hourly_rate_max: 15000
whatsapp_number: "+243971234567"  status: "approved"  rating_avg: 4.7  rating_count: 23
is_featured: false
```

---

## 3. `professions`

**Description:** Controlled list of trades. Seed data; managed by admins. Used for filtering/search.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK | |
| `slug` | `text` | UNIQUE, NOT NULL | URL key, e.g. `electrician`. |
| `name_fr` | `text` | NOT NULL | "Électricien". |
| `name_sw` | `text` | NULL | "Fundi wa umeme". |
| `name_en` | `text` | NULL | "Electrician". |
| `description` | `text` | NULL | Short explainer. |
| `icon` | `text` | NULL | Icon name/key. |
| `sort_order` | `int4` | default `0` | Display order. |
| `is_active` | `boolean` | default `true` | Hide without deleting. |
| `created_at` / `updated_at` | `timestamptz` | | |

**Relationships:** `1:N` to `workers`.

**Example values:**
```
slug: "plumber"  name_fr: "Plombier"  name_sw: "Fundi wa maji"  name_en: "Plumber"
icon: "pipe"  sort_order: 2  is_active: true
```
Seed set: electrician, plumber, carpenter, mason, welder, painter, construction.

---

## 4. `locations`

**Description:** Bukavu neighborhoods/quartiers (and later, other cities). Hierarchical to support city → commune → quartier.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK | |
| `slug` | `text` | UNIQUE, NOT NULL | e.g. `ibanda`. |
| `name` | `text` | NOT NULL | "Ibanda". |
| `type` | `location_type` (enum: `city`, `commune`, `quartier`) | NOT NULL | Level in hierarchy. |
| `parent_id` | `uuid` | FK → `locations.id`, NULL | Self-reference for hierarchy. |
| `latitude` | `numeric(9,6)` | NULL | Optional centroid. |
| `longitude` | `numeric(9,6)` | NULL | Optional centroid. |
| `is_active` | `boolean` | default `true` | |
| `created_at` / `updated_at` | `timestamptz` | | |

**Relationships:** self-referential (`parent_id`); `1:N` to `workers`.

**Example values:**
```
slug: "kadutu"  name: "Kadutu"  type: "commune"  parent_id: <bukavu city id>
latitude: -2.5167  longitude: 28.8500  is_active: true
```
Bukavu seed (communes): Ibanda, Kadutu, Bagira (plus quartiers under each).

---

## 5. `reviews`

**Description:** Customer reviews of a worker. One review per (customer, worker) by default; moderated.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK | |
| `worker_id` | `uuid` | FK → `workers.id`, NOT NULL | Reviewed worker. |
| `author_user_id` | `uuid` | FK → `users.id`, NULL | Reviewer (NULL if guest review w/ phone). |
| `author_name` | `text` | NOT NULL | Display name (denormalized for guests). |
| `author_phone` | `text` | NULL | For anti-fraud / verification. |
| `rating` | `int2` | NOT NULL, CHECK (`between 1 and 5`) | Star rating. |
| `comment` | `text` | NULL | Free text. |
| `status` | `review_status` (enum: `pending`, `published`, `rejected`) | NOT NULL, default `pending` | Moderation. |
| `job_request_id` | `uuid` | FK → `job_requests.id`, NULL | Link to verified job if available. |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | | |

**Constraints:** `UNIQUE (worker_id, author_user_id)` (partial, where `author_user_id IS NOT NULL`) to limit duplicate reviews.

**Relationships:** `N:1` to `workers` and `users`; optional `N:1` to `job_requests`. Updating a published review recomputes `workers.rating_avg`/`rating_count` (trigger or app logic).

**Example values:**
```
worker_id: a12...  author_name: "Sarah K."  rating: 5
comment: "Travail rapide et propre. Très professionnel."  status: "published"
```

---

## 6. `worker_photos`

**Description:** Portfolio/gallery images for a worker (past jobs, ID/certificate proofs flagged separately). Stored on Cloudinary; DB keeps metadata only.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK | |
| `worker_id` | `uuid` | FK → `workers.id`, NOT NULL | Owner. |
| `cloudinary_public_id` | `text` | NOT NULL | Cloudinary asset id. |
| `url` | `text` | NOT NULL | Delivery URL (transformable). |
| `type` | `photo_type` (enum: `portfolio`, `avatar`, `verification`) | NOT NULL, default `portfolio` | Purpose. |
| `caption` | `text` | NULL | Optional. |
| `width` | `int4` | NULL | For layout/CLS. |
| `height` | `int4` | NULL | For layout/CLS. |
| `sort_order` | `int4` | default `0` | Gallery order. |
| `is_primary` | `boolean` | default `false` | Cover image. |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | | |

**Relationships:** `N:1` to `workers`. `verification` photos are visible to admins only (enforced by RLS).

**Example values:**
```
worker_id: a12...  cloudinary_public_id: "fundi/workers/a12/job1"
url: "https://res.cloudinary.com/.../job1.jpg"  type: "portfolio"
caption: "Installation tableau électrique"  is_primary: true  width: 1080 height: 1350
```

---

## 7. `leads`

**Description:** Records every time a customer initiates contact with a worker (WhatsApp click, call, or contact form). The core conversion + monetization signal.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK | |
| `worker_id` | `uuid` | FK → `workers.id`, NOT NULL | Who was contacted. |
| `customer_user_id` | `uuid` | FK → `users.id`, NULL | NULL for anonymous visitors. |
| `channel` | `lead_channel` (enum: `whatsapp`, `call`, `form`) | NOT NULL | How contact happened. |
| `source_page` | `text` | NULL | e.g. `worker_profile`, `listing`. |
| `customer_phone` | `text` | NULL | If provided via form. |
| `message` | `text` | NULL | Optional message from form. |
| `status` | `lead_status` (enum: `new`, `contacted`, `converted`, `lost`) | default `new` | Funnel state (mostly self-reported/future). |
| `ip_hash` | `text` | NULL | Hashed IP for abuse throttling (no raw PII). |
| `user_agent` | `text` | NULL | Device analytics. |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Relationships:** `N:1` to `workers` and (optionally) `users`. Incrementing a lead bumps `workers.lead_count`.

**Example values:**
```
worker_id: a12...  customer_user_id: null  channel: "whatsapp"
source_page: "worker_profile"  status: "new"  ip_hash: "b3a9..."
```

---

## 8. `job_requests`

**Description:** Optional structured request a customer can post ("I need a plumber in Ibanda tomorrow"). Enables future broadcast/matching. In MVP this may be minimal or admin-assisted.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK | |
| `customer_user_id` | `uuid` | FK → `users.id`, NULL | Requester (NULL if guest). |
| `customer_name` | `text` | NOT NULL | Denormalized. |
| `customer_phone` | `text` | NOT NULL | Contact. |
| `profession_id` | `uuid` | FK → `professions.id`, NOT NULL | Trade needed. |
| `location_id` | `uuid` | FK → `locations.id`, NOT NULL | Where. |
| `title` | `text` | NOT NULL | Short summary. |
| `description` | `text` | NULL | Details. |
| `budget_min` | `int4` | NULL | CDF. |
| `budget_max` | `int4` | NULL | CDF. |
| `preferred_date` | `date` | NULL | When needed. |
| `status` | `job_status` (enum: `open`, `assigned`, `closed`, `cancelled`) | default `open` | Lifecycle. |
| `assigned_worker_id` | `uuid` | FK → `workers.id`, NULL | If matched. |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | | |

**Relationships:** `N:1` to `users`, `professions`, `locations`, and optionally `workers`; `1:N` to `reviews`.

**Example values:**
```
customer_name: "Patrick M."  customer_phone: "+243990000000"
profession_id: <plumber>  location_id: <ibanda>
title: "Fuite sous évier cuisine"  budget_max: 30000  preferred_date: 2026-06-10
status: "open"
```

---

## 9. `admin_users`

**Description:** Platform staff with elevated privileges (moderation, support). Separate from `users` for least privilege and clean RLS. Authenticated via the same Supabase auth, gated by membership here.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK, FK → `auth.users.id` | Auth identity. |
| `full_name` | `text` | NOT NULL | |
| `email` | `text` | UNIQUE, NOT NULL | Admin login. |
| `admin_role` | `admin_role` (enum: `super_admin`, `moderator`, `support`) | NOT NULL, default `moderator` | Permission level. |
| `is_active` | `boolean` | NOT NULL, default `true` | Disable without deleting. |
| `last_login_at` | `timestamptz` | NULL | |
| `created_at` / `updated_at` | `timestamptz` | | |

**Relationships:** referenced by `audit_logs.actor_admin_id`. A DB function `is_admin(uid)` powers RLS policies on moderated tables.

**Example values:**
```
email: "admin@fundi.cd"  full_name: "Equipe Fundi"  admin_role: "super_admin"
is_active: true
```

---

## 10. `audit_logs`

**Description:** Immutable record of sensitive actions (approvals, edits, deletions, status changes). Append-only; never updated or deleted.

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `uuid` | PK | |
| `actor_admin_id` | `uuid` | FK → `admin_users.id`, NULL | Who acted (NULL = system). |
| `actor_user_id` | `uuid` | FK → `users.id`, NULL | If action by a normal user. |
| `action` | `text` | NOT NULL | e.g. `worker.approved`, `worker.deleted`. |
| `entity_type` | `text` | NOT NULL | Table/entity name. |
| `entity_id` | `uuid` | NOT NULL | Affected row id. |
| `before` | `jsonb` | NULL | Snapshot before change. |
| `after` | `jsonb` | NULL | Snapshot after change. |
| `ip_hash` | `text` | NULL | Hashed source IP. |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Event time. |

**Constraints:** no `UPDATE`/`DELETE` allowed (enforced via RLS + revoked grants). Index on `(entity_type, entity_id)` and `(created_at)`.

**Relationships:** `N:1` to `admin_users` and/or `users`.

**Example values:**
```
actor_admin_id: <admin>  action: "worker.approved"  entity_type: "workers"
entity_id: a12...  before: {"status":"pending"}  after: {"status":"approved"}
```

---

## Entity Relationship Summary

```
auth.users 1───1 users 1───1 workers ──N profession (professions)
                  │              └──N location (locations)
                  │              ├──1:N worker_photos
                  │              ├──1:N reviews
                  │              └──1:N leads
                  ├──1:N reviews (as author)
                  └──1:N job_requests ──N profession / location
                                       └──0:1 assigned worker

admin_users 1───N audit_logs
locations  1───N locations (self, parent_id)
```

## Enums (create as Postgres types)

`user_role`, `worker_status`, `location_type`, `review_status`, `photo_type`,
`lead_channel`, `lead_status`, `job_status`, `admin_role`.

## Indexing notes (performance on low bandwidth = fewer, faster queries)

- `workers (status, profession_id, location_id)` composite for the main listing filter.
- `workers (rating_avg DESC)` and `workers (is_featured DESC)` for sorting.
- GIN index on `workers.service_areas` (array) and on a `tsvector` of `headline || bio` for keyword search.
- `reviews (worker_id, status)`, `leads (worker_id, created_at)`, `audit_logs (entity_type, entity_id)`.
