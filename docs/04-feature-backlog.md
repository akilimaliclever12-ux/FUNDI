# Feature Backlog — Fundi

> Organized by release. **Priority:** P0 (must) · P1 (should) · P2 (nice). **Complexity:** S / M / L / XL.
> Guiding rule: nothing ships that doesn't help someone **hire or get hired**. MVP must launch in ~30 days.

---

## MVP — Must-have for launch (≤ 30 days)

### M1. Worker directory / listing
- **Description:** Public, paginated list of approved workers with photo, name, profession, neighborhood, rating, and a WhatsApp button.
- **User Story:** *As a customer, I want to browse available workers so that I can find someone for my job.*
- **Priority:** P0 · **Complexity:** M
- **Dependencies:** DB (`workers`, `professions`, `locations`), Cloudinary delivery.

### M2. Search & filter (profession, neighborhood, keyword)
- **Description:** Filter the listing by profession and neighborhood, plus a keyword search over headline/bio.
- **User Story:** *As a customer, I want to filter by trade and area so that I quickly find a relevant worker near me.*
- **Priority:** P0 · **Complexity:** M
- **Dependencies:** M1, indexes / search vector on `workers`.

### M3. Worker profile page
- **Description:** Full profile: photos gallery, bio, experience, profession, service areas, rating + reviews, prominent **Contact on WhatsApp** CTA.
- **User Story:** *As a customer, I want to see a worker's details and past work so that I can trust them before contacting.*
- **Priority:** P0 · **Complexity:** M
- **Dependencies:** M1, `worker_photos`, `reviews`.

### M4. WhatsApp contact (lead capture)
- **Description:** "Contact on WhatsApp" deep link (`wa.me`) prefilled with a polite message; each click logs a `lead`.
- **User Story:** *As a customer, I want to message a worker on WhatsApp in one tap so that I can hire them immediately.*
- **Priority:** P0 · **Complexity:** S
- **Dependencies:** M3, `leads` table, WhatsApp link builder.

### M5. Worker onboarding / create profile
- **Description:** Signup + profile creation: name, phone (OTP), profession, location, experience, bio, WhatsApp number, photo upload. Submits as `pending`.
- **User Story:** *As a worker, I want to create a profile so that customers can find and contact me.*
- **Priority:** P0 · **Complexity:** L
- **Dependencies:** Supabase Auth (phone OTP), Cloudinary upload, `workers`, `worker_photos`.

### M6. Photo upload (Cloudinary)
- **Description:** Upload 1–N portfolio photos + avatar, compressed and transformed via Cloudinary; metadata stored in DB.
- **User Story:** *As a worker, I want to show photos of my work so that customers trust my skills.*
- **Priority:** P0 · **Complexity:** M
- **Dependencies:** Cloudinary integration, `worker_photos`.

### M7. Admin: review & moderate workers
- **Description:** Admin dashboard to view, **approve / reject / edit / delete / suspend** workers; rejection reason; verification photo view. Actions audited.
- **User Story:** *As an admin, I want to vet workers so that only trusted, real profiles go public.*
- **Priority:** P0 · **Complexity:** L
- **Dependencies:** `admin_users`, RLS, `audit_logs`, M5.

### M8. Authentication (phone-first)
- **Description:** Phone OTP signup/login for workers; lightweight session. Customers can browse/contact without an account.
- **User Story:** *As a worker, I want to sign in with my phone so that I can manage my profile without needing email.*
- **Priority:** P0 · **Complexity:** M
- **Dependencies:** Supabase Auth, `users`.

### M9. Core public pages (Home, About, Contact)
- **Description:** Home with hero + search + top professions; About (trust/mission); Contact (WhatsApp + form).
- **User Story:** *As a visitor, I want to understand the service and start searching so that I can find help fast.*
- **Priority:** P0 · **Complexity:** S
- **Dependencies:** M2.

### M10. Mobile-first, low-bandwidth performance baseline
- **Description:** Optimized images, minimal JS, SSG/ISR, skeleton loaders; works on 3G and low-end phones.
- **User Story:** *As a user on a slow connection, I want pages to load quickly so that I don't give up.*
- **Priority:** P0 · **Complexity:** M
- **Dependencies:** all public pages.

### M11. Basic reviews (read + moderated submit)
- **Description:** Display published reviews on profiles; allow customers to submit a rating + comment (moderated to `pending`).
- **User Story:** *As a customer, I want to read and leave reviews so that good workers are rewarded and others can trust them.*
- **Priority:** P1 (can launch read-only, add submit fast-follow) · **Complexity:** M
- **Dependencies:** `reviews`, M3, admin moderation.

### M12. Seed data (professions + Bukavu locations) & SEO basics
- **Description:** Seed 7 professions and Bukavu communes/quartiers; meta tags, sitemap, Search Console.
- **User Story:** *As the business, I want the directory pre-populated and findable on Google so that growth starts at launch.*
- **Priority:** P0 · **Complexity:** S
- **Dependencies:** `professions`, `locations`.

---

## Version 1.1 — After validation

### V1.1-1. Worker self-service dashboard
- **Description:** Workers edit their own profile, manage photos, see lead/view counts, toggle availability.
- **User Story:** *As a worker, I want to manage my profile and see my interest so that I stay relevant.*
- **Priority:** P1 · **Complexity:** M · **Dependencies:** M5, M8.

### V1.1-2. Job requests (customer posts a need)
- **Description:** Customers post a structured request (trade, area, budget, date); admins/workers can respond.
- **User Story:** *As a customer, I want to describe my job so that suitable workers reach out to me.*
- **Priority:** P1 · **Complexity:** L · **Dependencies:** `job_requests`.

### V1.1-3. Verified reviews tied to jobs
- **Description:** Link reviews to a recorded lead/job to reduce fake reviews; "verified" badge.
- **User Story:** *As a customer, I want to trust reviews so that ratings reflect real work.*
- **Priority:** P1 · **Complexity:** M · **Dependencies:** M11, `leads`/`job_requests`.

### V1.1-4. Multi-language UI (FR / SW / EN toggle)
- **Description:** Full i18n with language switch; persisted preference.
- **User Story:** *As a Swahili-first user, I want the app in my language so that it's easy to use.*
- **Priority:** P1 · **Complexity:** M · **Dependencies:** content audit.

### V1.1-5. WhatsApp notifications (Cloud API)
- **Description:** Notify workers of new leads/requests via WhatsApp Cloud API templates.
- **User Story:** *As a worker, I want a WhatsApp alert when someone wants me so that I respond fast.*
- **Priority:** P1 · **Complexity:** L · **Dependencies:** WhatsApp Business/Cloud API approval.

### V1.1-6. Map / location view (OpenStreetMap)
- **Description:** Show workers on a lightweight map by neighborhood.
- **User Story:** *As a customer, I want to see workers near me on a map so that I judge distance.*
- **Priority:** P2 · **Complexity:** M · **Dependencies:** `locations` coords.

### V1.1-7. Save / favorite workers & share
- **Description:** Bookmark workers; share a profile via WhatsApp link.
- **User Story:** *As a customer, I want to save and share good workers so that I can hire later or refer friends.*
- **Priority:** P2 · **Complexity:** S · **Dependencies:** M3.

### V1.1-8. Analytics dashboard (admin)
- **Description:** Leads, signups, top professions/areas, conversion funnel.
- **User Story:** *As the team, I want metrics so that I steer growth.*
- **Priority:** P1 · **Complexity:** M · **Dependencies:** `leads`, GA4.

---

## Version 2.0 — Marketplace & monetization

### V2-1. Featured / promoted listings (paid)
- **Description:** Workers pay to appear higher / be highlighted.
- **User Story:** *As a worker, I want to boost visibility so that I get more clients.*
- **Priority:** P1 · **Complexity:** M · **Dependencies:** `is_featured`, payments.

### V2-2. Subscriptions / premium worker plans
- **Description:** Monthly plan: more photos, badges, priority placement, lead alerts.
- **User Story:** *As a serious worker, I want a pro plan so that I stand out and win more work.*
- **Priority:** P1 · **Complexity:** L · **Dependencies:** payments, V1.1-1.

### V2-3. Mobile-money payments (M-Pesa / Airtel / Orange Money)
- **Description:** Local mobile-money for subscriptions/boosts and (later) in-platform job payments.
- **User Story:** *As a Congolese user, I want to pay with mobile money so that I can transact easily.*
- **Priority:** P0 (for monetization) · **Complexity:** XL · **Dependencies:** payment aggregator integration, compliance.

### V2-4. Pay-per-lead / lead credits
- **Description:** Workers buy credits; spend on receiving customer contacts.
- **User Story:** *As a worker, I want to pay only for real leads so that my spend is efficient.*
- **Priority:** P1 · **Complexity:** L · **Dependencies:** `leads`, payments.

### V2-5. In-platform booking & job lifecycle
- **Description:** Request → quote → accept → complete → review, tracked in-app.
- **User Story:** *As a customer, I want to manage a job end-to-end so that everything is in one place.*
- **Priority:** P2 · **Complexity:** XL · **Dependencies:** V1.1-2, payments.

### V2-6. Escrow / secured payments
- **Description:** Hold customer payment until job confirmed done.
- **User Story:** *As a customer, I want payment protection so that I only pay for completed work.*
- **Priority:** P2 · **Complexity:** XL · **Dependencies:** V2-3, V2-5, legal.

### V2-7. Skills verification & badges
- **Description:** Document/cert checks, ID verification tiers, trust badges.
- **User Story:** *As a customer, I want verified credentials so that I hire with confidence.*
- **Priority:** P1 · **Complexity:** M · **Dependencies:** M7 verification flow.

### V2-8. Multi-city expansion (Goma, Kinshasa, …)
- **Description:** Generalize location model and brand for new cities.
- **User Story:** *As the business, I want to expand so that we grow beyond Bukavu.*
- **Priority:** P1 · **Complexity:** L · **Dependencies:** `locations` hierarchy, ops.

### V2-9. Native / PWA app & offline-light
- **Description:** Installable PWA, offline caching of recent searches.
- **User Story:** *As a user with patchy data, I want an installable, resilient app so that it works anywhere.*
- **Priority:** P2 · **Complexity:** L · **Dependencies:** M10.
