# Fundi — Bukavu

Plateforme mobile-first qui connecte les habitants de Bukavu (RDC) avec des travailleurs
qualifiés vérifiés (électriciens, plombiers, menuisiers, maçons, soudeurs, peintres,
professionnels du bâtiment). Contact direct via **WhatsApp**.

Stack : **Next.js (App Router) · TypeScript · Supabase · Tailwind CSS · Cloudinary · WhatsApp**.

See [`CLAUDE.md`](./CLAUDE.md) and [`docs/`](./docs) for full product, brand, data, and
architecture documentation.

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local      # then fill in Supabase + Cloudinary keys

# 3. Database (Supabase CLI)
supabase start                  # local stack (or use a hosted project)
supabase db reset               # runs migrations in supabase/migrations + seed.sql
npm run db:types                # regenerate src/types/database.types.ts

# 4. Run
npm run dev                     # http://localhost:3000
```

## Scripts

| Script | What |
|--------|------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Start production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:types` | Generate DB types from Supabase |

## Project structure (high level)

```
src/app/                 # routes: public, (worker), admin, api
src/components/          # ui / features / layout
src/lib/                 # supabase clients, cloudinary, whatsapp, queries, validations
supabase/migrations/     # SQL schema (source of truth)
supabase/seed.sql        # professions + Bukavu locations
docs/                    # brand, data dictionary, architecture, backlog, integrations, incidents
```

## Key flows

- **Find & contact:** `/workers` (search/filter) → `/workers/[id]` → WhatsApp button (logs a lead).
- **Become a fundi:** `/rejoindre` → phone OTP → profile + photos → status `pending`.
- **Admin:** `/admin` (guarded; login at `/admin-login`) → approve/reject/edit/delete, moderate reviews, view leads.

## Security model

- **RLS on every table** is the trust boundary; only `approved` workers are public.
- Service-role key is **server-only** (`src/lib/supabase/admin.ts`, `server-only` import).
- All admin mutations are written to `audit_logs` (append-only).

## Making the first admin

After creating a user in Supabase Auth, insert them into `admin_users`:

```sql
insert into public.admin_users (id, full_name, email, admin_role)
values ('<auth-user-uuid>', 'Equipe Fundi', 'admin@fundi.cd', 'super_admin');
```
