# Integrations Document — Fundi

> All third-party services, why we use them, what they cost, how hard they are, the keys they need, and their risks.
> Context: Bukavu DRC, mobile-first, WhatsApp-heavy, low bandwidth. **Costs in USD, approximate, 2026.** Keep the stack lean.

**Legend — Complexity:** S (hours) · M (1–2 days) · L (3+ days / approval needed).
**Key storage rule:** server-only secrets never ship to the browser. Only `NEXT_PUBLIC_*` values are public. Store all keys in Vercel/Supabase env settings, never in git.

---

## 1. Supabase — Database, Auth, Storage *(core)*
- **Purpose:** PostgreSQL database, phone/email auth, Row Level Security, file storage, optional Edge Functions. Backbone of the app.
- **Cost:** Free tier (500MB DB, 1GB storage, 50K MAU) for launch → **Pro ~$25/mo** when we outgrow it.
- **Complexity:** M — schema, RLS policies, auth setup.
- **Required API keys / env:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, RLS-bound)
  - `SUPABASE_SERVICE_ROLE_KEY` (**server-only, secret** — bypasses RLS)
- **Risks:** Service-role key leak = full data exposure (mitigate: server-only, rotate). Misconfigured RLS = data leak (mitigate: default-deny + tests). Vendor lock-in (mitigate: it's standard Postgres, exportable). Free-tier project pausing on inactivity during early days.

## 2. WhatsApp — Customer ↔ worker contact *(core conversion)*
- **Purpose:** The main way customers reach workers. **MVP:** `wa.me/<number>?text=...` deep links (no API, free). **Later (V1.1):** WhatsApp **Cloud API** for lead notifications/templates.
- **Cost:** MVP **$0** (deep links). Cloud API: free tier of service conversations, then **per-conversation pricing** (varies by country; ~$0.005–0.08); needs a Meta Business account.
- **Complexity:** S for deep links · L for Cloud API (Meta Business verification, phone number, template approval).
- **Required API keys / env:** MVP: none. Cloud API: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (all server-only).
- **Risks:** Number formatting errors (enforce E.164). Cloud API approval delays and policy compliance. Message template rejection. Spam/abuse if links are scraped (mitigate: log leads, rate-limit, reveal number on intent).

## 3. Cloudinary — Image upload, optimization, delivery *(core)*
- **Purpose:** Store and serve worker photos with automatic compression (`q_auto`), format negotiation (`f_auto`, WebP/AVIF), and responsive resizing — critical for low bandwidth.
- **Cost:** Free tier (~25 credits/mo ≈ 25GB storage/bandwidth/transforms combined) covers launch → paid plans from **~$89/mo** at scale (evaluate alternatives like imgix/Bunny if needed).
- **Complexity:** M — upload flow (prefer signed/unsigned upload with constraints), transformation URLs.
- **Required API keys / env:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` (server), `CLOUDINARY_API_SECRET` (**server-only**), and an upload preset name.
- **Risks:** Unsigned uploads abused (mitigate: signed uploads, type/size limits, moderation). Cost spikes from large/unoptimized assets (mitigate: enforce transforms, cap dimensions). Hotlinking.

## 4. Resend — Transactional email
- **Purpose:** Admin notifications, worker approval/rejection emails, contact-form delivery, internal alerts. (Email is secondary in DRC; SMS/WhatsApp matter more, but email is needed for admins/diaspora.)
- **Cost:** Free tier **3,000 emails/mo** → from **$20/mo** for more.
- **Complexity:** S — API + a couple templates; domain DNS for deliverability.
- **Required API keys / env:** `RESEND_API_KEY` (server-only); verified sending domain (DNS: SPF/DKIM).
- **Risks:** Deliverability/spam if domain unverified (mitigate: SPF/DKIM/DMARC). Low open rates in target market — don't rely on email for worker comms (use WhatsApp).

## 5. Google Maps Platform — Geocoding / maps *(optional)*
- **Purpose:** Accurate geocoding and (optionally) map display of worker areas. Likely **deferred** in favor of OpenStreetMap to save cost.
- **Cost:** Pay-as-you-go with **$200/mo free credit**; Maps loads ~$7/1k, geocoding ~$5/1k after credit.
- **Complexity:** M — billing setup, key restrictions.
- **Required API keys / env:** `GOOGLE_MAPS_API_KEY` (restrict by HTTP referrer + API; treat as semi-public).
- **Risks:** **Billing required even for free tier** — runaway cost if key unrestricted/leaked (mitigate: restrict key, set quotas/budgets/alerts). Overkill for MVP. **Decision: prefer OpenStreetMap (below) unless precision geocoding is needed.**

## 6. OpenStreetMap + Leaflet — Lightweight maps *(preferred for maps)*
- **Purpose:** Free, lightweight maps and neighborhood display without per-call billing. Good fit for low-cost, low-bandwidth.
- **Cost:** **Free** (respect tile usage policy; use a free/community or low-cost tile provider, e.g. tiles with fair-use or a cheap provider for scale).
- **Complexity:** S–M — Leaflet/MapLibre integration; lazy-load (maps are heavy JS — load only when needed).
- **Required API keys / env:** None for OSM tiles (optional token if using a tile host like MapTiler: `MAPTILER_KEY`).
- **Risks:** Tile-usage policy limits on the free OSM tile server (mitigate: use a proper tile provider at scale). Map JS weight on slow networks (mitigate: lazy-load, only on map views).

## 7. Meta Pixel — Marketing analytics / ads
- **Purpose:** Track conversions for Facebook/Instagram ads (key acquisition channel in the region); retargeting.
- **Cost:** **Free** (you pay for the ads, not the pixel).
- **Complexity:** S — script + event calls. Defer loading off the critical path.
- **Required API keys / env:** `NEXT_PUBLIC_META_PIXEL_ID` (public). For server events (Conversions API): `META_CAPI_ACCESS_TOKEN` (server-only).
- **Risks:** Privacy/consent compliance (mitigate: consent notice, minimal PII). Performance hit if loaded eagerly (mitigate: defer/lazy). Tracking blocked by browsers (consider CAPI later).

## 8. Google Analytics 4 — Product analytics
- **Purpose:** Understand traffic, search usage, profile views, WhatsApp clicks (as events), funnels.
- **Cost:** **Free**.
- **Complexity:** S — GA4 tag + custom events (e.g. `whatsapp_click`, `worker_view`).
- **Required API keys / env:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` (public).
- **Risks:** Adds JS weight (mitigate: load deferred, use lightweight `@next/third-parties`). Privacy/consent. Data sampling at high volume.

## 9. Google Search Console — SEO monitoring
- **Purpose:** Index coverage, search performance, sitemap submission — organic growth for "électricien Bukavu" type queries.
- **Cost:** **Free**.
- **Complexity:** S — verify domain, submit sitemap.
- **Required API keys / env:** Domain verification (DNS TXT or meta tag). No runtime key.
- **Risks:** Minimal. Requires correct sitemap + SSR/SSG content to index well (handled by Next.js SSG/ISR).

---

## Future / conditional integrations

| Service | Purpose | When | Notes |
|---------|---------|------|-------|
| **Mobile money** (M-Pesa, Airtel Money, Orange Money — via aggregator e.g. Flutterwave/local) | Monetization payments | V2.0 | XL complexity, compliance/KYC, local entity likely required. |
| **SMS gateway** (e.g. local provider / Africa's Talking) | OTP fallback where WhatsApp/email weak | If phone OTP needs SMS | Cost per SMS; choose provider with DRC coverage. |
| **Sentry** | Error monitoring | Soon after launch | Free tier; feeds `docs/06-journal-erreurs.md`. |
| **Upstash/Redis** | Rate limiting, caching | At scale | Serverless-friendly, cheap. |

---

## Environment variables checklist

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=              # server-only secret
CLOUDINARY_UPLOAD_PRESET=

# Resend
RESEND_API_KEY=                     # server-only secret

# WhatsApp Cloud API (V1.1+)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=              # server-only secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=      # server-only secret

# Analytics / Marketing (public)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=             # server-only, optional

# Maps (optional)
GOOGLE_MAPS_API_KEY=                # restricted; or omit
MAPTILER_KEY=                       # optional, if using hosted OSM tiles
```

## Rough monthly cost at launch vs. scale

| Stage | Services in use | Approx. monthly |
|-------|-----------------|-----------------|
| **Launch (MVP)** | Supabase free, Cloudinary free, Resend free, WhatsApp deep links, GA4/Pixel/Search Console free, Vercel hobby/pro | **~$0–20** |
| **Early growth** | Supabase Pro, Cloudinary free→paid edge, Vercel Pro | **~$45–120** |
| **Scale** | Supabase Pro+, Cloudinary paid, WhatsApp Cloud API, payments fees, monitoring | **~$150–400+** |
