# CLAUDE.md — Fundi (Bukavu)

> Project memory for Claude Code. Read this first in every session. It defines what we're building and the rules to follow. Keep answers and code aligned with this file.

## Project Overview

**Fundi** is a mobile-first platform that connects customers in **Bukavu, DRC** with verified skilled workers: **electricians, plumbers, carpenters, masons, welders, painters, and construction professionals.**

- **Mission:** make it fast and safe to find trusted workers, and help workers get more clients.
- **Primary action (conversion):** a customer contacts a worker — usually via **WhatsApp**.
- **Constraints that drive every decision:** mobile-first, **WhatsApp-centric**, **low/intermittent bandwidth**, low-end Android phones, French + Swahili users, price-sensitive market.
- **MVP goal:** lean, launchable in ~30 days. Ship a trusted worker directory with search, profiles, worker onboarding, and admin moderation.

When in doubt, optimize for: **simplicity, speed on slow networks, and trust.** Do not add features that don't help someone hire or get hired.

## Tech Stack

- **Framework:** Next.js (App Router) + **TypeScript** (strict).
- **Styling:** Tailwind CSS. Mobile-first utility classes.
- **Backend / DB / Auth:** **Supabase** (PostgreSQL, Auth, Storage, RLS, Edge Functions if needed).
- **Images:** **Cloudinary** (upload, transform, responsive delivery, compression).
- **Messaging:** **WhatsApp** via `wa.me` deep links (MVP); WhatsApp Cloud API later.
- **Email:** Resend (transactional).
- **Hosting:** Vercel (frontend) + Supabase (managed backend).
- **Analytics:** Google Analytics 4 + Meta Pixel; Google Search Console for SEO.

Do not introduce new heavy dependencies without justification. Prefer the platform (Next.js, Supabase) over extra libraries.

## Coding Standards

- **TypeScript strict mode**; no `any` unless unavoidable and commented.
- Prefer **Server Components** and server actions; use Client Components only when interactivity requires it (`"use client"` at top, kept small).
- Keep components **small and single-purpose**. Extract shared UI into `components/ui`.
- **No secrets in client code.** Use `NEXT_PUBLIC_` prefix only for truly public values.
- Validate all external input with **Zod** at the boundary (forms, API routes, server actions).
- Handle errors explicitly; never swallow. Show user-friendly messages in French by default.
- Write code that matches the surrounding style. Run lint + typecheck before considering work done.
- Comments explain **why**, not what. Keep them sparse and useful.

## Naming Conventions

- **Files/folders:** `kebab-case` (e.g. `worker-card.tsx`, `worker-profile/`).
- **React components:** `PascalCase` (`WorkerCard`).
- **Variables/functions:** `camelCase`. **Booleans:** `is/has/can` prefix.
- **Types/interfaces:** `PascalCase`; DB row types suffixed `Row` (e.g. `WorkerRow`).
- **Constants/enums values:** `UPPER_SNAKE_CASE` for true constants.
- **Database:** `snake_case`, **plural** tables (`workers`), `uuid` PKs, enums as Postgres types. (See `docs/02-data-dictionary.md`.)
- **Routes:** lowercase, hyphenated, French-friendly slugs where public (`/electriciens` optional alias).

## Folder Structure

```
fundi-bukavu/
├─ CLAUDE.md
├─ docs/                      # brand, data dictionary, backlog, integrations, incidents
├─ public/                    # static assets, icons, manifest
├─ supabase/
│  ├─ migrations/             # SQL migrations (source of truth for schema)
│  └─ seed.sql                # professions, locations seed
├─ src/
│  ├─ app/                    # Next.js App Router
│  │  ├─ (public)/            # home, listing, worker profile, about, contact
│  │  ├─ (worker)/            # worker onboarding & dashboard
│  │  ├─ admin/               # admin dashboard (protected)
│  │  ├─ api/                 # route handlers (leads, webhooks)
│  │  └─ layout.tsx
│  ├─ components/
│  │  ├─ ui/                  # buttons, inputs, cards (presentational)
│  │  └─ features/            # composed feature components
│  ├─ lib/
│  │  ├─ supabase/            # client/server/admin clients
│  │  ├─ cloudinary.ts
│  │  ├─ whatsapp.ts          # wa.me link builders
│  │  └─ validations/         # Zod schemas
│  ├─ types/                  # shared TS types, generated DB types
│  └─ styles/
└─ ...config files
```

## UI Principles

- **Mobile-first, then scale up.** Design for a 360px-wide screen first.
- **One primary action per screen.** Make "Contact on WhatsApp" obvious (green button).
- **French primary**, Swahili secondary; keep copy short and plain.
- **Thumb-friendly:** large tap targets (≥44px), bottom-reachable CTAs.
- **Low cognitive load:** clear hierarchy, minimal text, strong icons.
- **Skeletons over spinners**; show layout immediately to feel fast.
- **Accessible:** WCAG AA contrast, semantic HTML, labels on inputs, alt text on images.
- Reuse the brand system in `docs/01-brand-brief.md` (**black → blue gradient**, Inter font). Signature gradient `linear-gradient(135deg, #0A0F1F → #0B5FFF)`; use it for hero/primary CTAs/headers, flat `#0B5FFF` elsewhere, and keep the WhatsApp button green (`#25D366`).

## Performance Requirements

Bandwidth is the #1 constraint. Treat every kilobyte as expensive.

- **Initial JS budget:** keep route JS small; prefer Server Components, avoid large client bundles.
- **Images:** always through Cloudinary with `f_auto,q_auto`, responsive `srcset`, lazy-load below the fold, explicit width/height to avoid CLS. Never ship raw uploads.
- **Fonts:** self-host Inter via `next/font`, one family, `display: swap`.
- **Targets:** LCP < 2.5s on 3G, total initial transfer ideally < ~300KB for listing page.
- **Cache aggressively:** static generation / ISR for public pages; CDN caching; revalidate on data change.
- **Pagination, not infinite huge lists.** Fetch only what's shown.
- **No heavy third-party scripts on critical path.** Defer analytics.

## Security Rules

- **RLS enabled on every table.** Default deny; add explicit policies. (See data dictionary.)
- **Three Supabase clients:** anon (browser, RLS-bound), server (per-request, user session), and a **service-role client used only in trusted server code** — never exposed to the browser.
- Only **`approved`** workers are publicly readable. `pending/rejected/suspended` are hidden by policy.
- **Validate & sanitize all input** (Zod). Never trust client-provided ids for ownership — check `auth.uid()` in policies/queries.
- **No secrets in the repo or client bundle.** Use environment variables; document required keys in `docs/05-integrations.md`.
- **Rate-limit** lead creation, reviews, and auth endpoints; hash IPs (`ip_hash`), store no raw IPs.
- **Admin actions are audited** to `audit_logs` (append-only).
- Sanitize file uploads (type/size limits) before sending to Cloudinary; store only metadata in DB.
- Protect phone numbers: show worker WhatsApp only on intent (click), log as a `lead`.

## Database Rules

- **Schema changes only via migrations** in `supabase/migrations/` — never edit the DB by hand and never edit a committed migration; add a new one.
- Each migration is **idempotent where possible**, reversible in intent, and reviewed.
- Use **enums (Postgres types)** for fixed sets; `uuid` PKs; `timestamptz` for time; `snake_case`.
- Maintain `updated_at` via trigger; use `deleted_at` for soft deletes on user-facing tables.
- Add **indexes for every common filter/sort** (status, profession, location, rating, search vector).
- Cached aggregates (`rating_avg`, `rating_count`, `lead_count`) updated by trigger or transactional app logic — keep them consistent.
- Generate and commit **TypeScript types from the schema**; keep them in sync.
- Seed reference data (`professions`, `locations`) via `supabase/seed.sql`.

## Deployment Rules

- **Branches:** `main` = production, `dev` = integration. Feature branches → PR → review → merge.
- **Environments:** Preview (Vercel per-PR) → Staging (optional) → Production. Separate Supabase projects/keys per environment.
- **CI before merge:** typecheck, lint, build must pass. No direct pushes to `main`.
- **Migrations run as a deploy step**, before the app goes live; never auto-destructive in prod.
- **Secrets** live in Vercel/Supabase env settings, never in git. Rotate on exposure.
- Tag releases; keep a short changelog. Roll back by redeploying the previous build.
- Monitor errors (and log incidents in `docs/06-journal-erreurs.md`).

## Documentation Rules

- **The `docs/` folder is canonical.** Update it when decisions change.
- Update `docs/02-data-dictionary.md` whenever the schema changes (same PR).
- Update `docs/05-integrations.md` when adding/removing a third-party service or key.
- Every feature ships with a one-paragraph note in the backlog status / README if it changes behavior.
- Keep this `CLAUDE.md` current — it is the single source of truth for conventions.
- Prefer self-documenting code + concise READMEs over long prose.

## Testing Rules

- **Pragmatic, not dogmatic** — given the 30-day MVP, prioritize tests that protect the core flows.
- **Must test:** worker approval flow, RLS visibility (approved-only public), lead creation, search filters, auth.
- **Unit test** Zod schemas, WhatsApp link builders, and any pure utility (Vitest).
- **Integration test** critical API routes / server actions.
- **E2E (Playwright)** for the golden path: search → open profile → click WhatsApp; and worker signup → admin approve → appears publicly.
- Run **typecheck + lint + tests in CI**; a red build does not merge.
- When fixing a bug, add a **regression test** and log it in the incident journal.

---

### Quick reminders for Claude
- Bandwidth is sacred. Mobile-first. WhatsApp is the conversion.
- Only approved workers are public; enforce via RLS, not just UI.
- Schema changes = new migration + updated data dictionary, same PR.
- Don't add scope. MVP must launch in ~30 days. See `docs/04-feature-backlog.md`.
