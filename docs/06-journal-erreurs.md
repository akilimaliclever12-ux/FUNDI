# Journal d'Erreurs — Engineering Incident Log (Fundi)

> Append-only log of production/staging incidents and the procedures that keep quality high.
> Add the newest incident at the top. Never delete entries — close them. One incident = one entry.

---

## How to use this log

1. When something breaks (or nearly does), **create an entry immediately** using the template below.
2. Give it a unique **Error ID**: `FUNDI-YYYYMMDD-NN` (e.g. `FUNDI-20260606-01`).
3. Fill what you know now; update **Root Cause / Resolution / Prevention** as you learn more.
4. Set **Status**: `🔴 Open` → `🟡 Investigating` → `🟢 Resolved` → `⚪ Closed (postmortem done)`.
5. For any **Sev-1/Sev-2**, complete a **Postmortem** (procedure below) and link it.

**Severity scale**
| Sev | Meaning | Example |
|-----|---------|---------|
| **Sev-1** | Platform down / data loss / security breach | Site offline; RLS leak exposing data. |
| **Sev-2** | Core flow broken for many users | WhatsApp button broken; signup failing. |
| **Sev-3** | Partial / degraded; workaround exists | Search slow; some images missing. |
| **Sev-4** | Minor / cosmetic | Typo, alignment, edge-case warning. |

---

## Incident entry template (copy for each new incident)

```markdown
### FUNDI-YYYYMMDD-NN — <short title>

- **Date:** YYYY-MM-DD HH:MM (Africa/Lubumbashi, CAT)
- **Error ID:** FUNDI-YYYYMMDD-NN
- **Severity:** Sev-1 | Sev-2 | Sev-3 | Sev-4
- **Environment:** Production | Staging | Preview | Local
- **Reported by:** <name / channel>
- **Components:** <e.g. Auth, Listing, WhatsApp link, Cloudinary, Admin, DB/RLS>

- **Description:** What was observed? Symptoms, error messages, who/how many affected.
- **Root Cause:** The underlying technical cause (the "5 whys" answer). Fill once known.
- **Impact:** Users affected, duration, data/financial impact, conversion lost.
- **Resolution:** What fixed it (commit/PR, migration, config change, rollback).
- **Prevention:** Concrete follow-ups so it can't recur (tests, alerts, guardrails). Link tasks.
- **Status:** 🔴 Open | 🟡 Investigating | 🟢 Resolved | ⚪ Closed
- **Links:** PRs, logs, postmortem, related Error IDs.
```

---

## Incident log

### FUNDI-EXAMPLE-01 — (example) Approved workers not visible publicly

- **Date:** 2026-06-06 14:20 (CAT)
- **Error ID:** FUNDI-EXAMPLE-01
- **Severity:** Sev-2
- **Environment:** Production
- **Reported by:** Admin via WhatsApp
- **Components:** DB/RLS, Listing

- **Description:** Newly approved workers did not appear on the public listing; page showed empty results despite approvals in admin.
- **Root Cause:** RLS SELECT policy on `workers` checked `status = 'active'` but the enum value is `approved`; mismatch returned zero rows for anon.
- **Impact:** ~2 hours; all anonymous visitors saw an empty/short directory; lost leads during peak.
- **Resolution:** Corrected RLS policy to `status = 'approved'` (migration `00xx_fix_worker_select_policy.sql`); redeployed; verified anon read.
- **Prevention:** Added integration test asserting anon can read only `approved` workers; added a seeded staging check before deploys; documented enum values in data dictionary.
- **Status:** ⚪ Closed
- **Links:** PR #__, migration 00xx, postmortem below.

> Replace/remove this example once real incidents exist. Newest real incidents go above it.

---

## Procedures

### A. Bug Tracking
- **Single tracker** (GitHub Issues / chosen tool) is the source of truth. Every bug = one issue.
- **Required fields:** title, steps to reproduce, expected vs. actual, environment, severity, screenshots/logs.
- **Labels:** `bug`, `sev-1..4`, component (`auth`, `listing`, `whatsapp`, `cloudinary`, `admin`, `db`), `regression`, `needs-repro`.
- **Triage cadence:** daily quick triage; assign severity + owner. Sev-1/2 get immediate attention.
- **Definition of done:** fix merged + verified in staging/prod + **regression test added** + issue closed with the resolving PR linked.
- **Link to this journal:** any bug that caused a real incident gets an Error ID here.

### B. Regression Tracking
- Every confirmed bug fix **ships with a test that fails before the fix and passes after** (unit/integration/E2E as appropriate).
- Tag such tests/issues with `regression` and reference the Error ID in the test name or comment.
- **CI gate:** the full test suite (typecheck, lint, unit, integration, E2E golden path) must pass before merge to `main`.
- Maintain a short **regression checklist** for the core flows, run before each release:
  1. Search → filter → open profile → **WhatsApp click logs a lead**.
  2. Worker signup → admin approve → worker appears publicly (and only when approved).
  3. Photo upload → optimized delivery.
  4. Reviews submit → moderated → published updates rating.
- Watch for **performance regressions** (see Tech Debt) — bundle size / LCP budget checks in CI.

### C. Postmortems (blameless)
- **Trigger:** required for all **Sev-1 and Sev-2** incidents; optional but encouraged for Sev-3.
- **Timing:** draft within **48 hours** of resolution while details are fresh.
- **Blameless principle:** focus on systems and process, not individuals.
- **Template:**
  1. **Summary** — one paragraph: what happened, impact, duration.
  2. **Timeline** — detection → diagnosis → mitigation → resolution (with timestamps).
  3. **Root cause** — technical + contributing factors (the "5 whys").
  4. **Impact** — users, leads, data, money, trust.
  5. **What went well / what went poorly.**
  6. **Action items** — concrete, owned, dated, tracked as issues (prevention > cure).
  7. **Lessons learned.**
- Store postmortems under `docs/postmortems/FUNDI-YYYYMMDD-NN.md` and link from the incident entry.

### D. Technical Debt Monitoring
- **Capture:** anything knowingly deferred or hacky gets a `// TODO(debt): …` comment **and** a tracker issue labeled `tech-debt` with: what, why deferred, risk, rough effort.
- **Register:** keep a running list (issue label or a `docs/tech-debt.md`) reviewed in a **monthly debt review**.
- **Prioritize** by risk × likelihood × effort. Reserve a slice of each cycle (~10–20%) for debt paydown.
- **Watch areas for this project:**
  - RLS policy coverage and correctness (security debt = top priority).
  - Image/performance budget on listing & profile (LCP, bundle size on 3G).
  - Search scalability (move from `ILIKE` to proper FTS/index as data grows).
  - WhatsApp deep-link → Cloud API migration.
  - Missing tests around money/lead/review aggregation.
- **Guardrail:** Sev-1 caused by known, logged debt must be reviewed in the postmortem — did we deprioritize it wrongly?

---

### Status legend
🔴 Open · 🟡 Investigating · 🟢 Resolved · ⚪ Closed (postmortem complete)
