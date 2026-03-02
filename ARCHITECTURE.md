# AdilStore — Architecture Review & Roadmap

> **Prepared for:** CandanUmut / AdilStore
> **Date:** 2026-03-02
> **Reviewer:** Senior Product Engineer

---

## STEP 1 — Repo Audit (Brutally Honest)

### What exists right now

The entire product is **one HTML file** (3,062 lines) — `index.html`. It contains inline CSS, inline JavaScript as an ES module, bilingual translations, 47 hardcoded apps, Supabase client config, all UI logic, and all rendering. It is hosted on GitHub Pages. There is no build system, no package manager, no tests, no CI, no deployment pipeline.

**Backend: Supabase** (confirmed)
- Project: `jezaquyloiwzzaetmpsc.supabase.co`
- Tables in use: `adil_apps`, `adil_app_ratings`, `adil_app_submissions`
- Storage bucket: `adil-icons`
- The anon key is hardcoded in the HTML (acceptable for Supabase anon keys with proper RLS, but a bad habit)

---

### Architecture assessment

**What's solid:**
- The visual design is genuinely good — the dark glassmorphism aesthetic is clean and on-brand
- The bilingual (EN/TR) implementation is thorough and well-structured
- The fallback-to-hardcoded-apps pattern is smart: the store works even if Supabase is down
- Supabase was the right backend choice: auth, storage, Realtime, Edge Functions, and Postgres all available
- The Intersection Observer scroll animations are performant and accessibility-aware
- Category filter + diacritic-normalized search works correctly
- The iframe preview system with 6s timeout is a clever UX decision

**What's fragile:**
- A 3,062-line single-file app cannot scale; adding a developer portal, auth flow, or admin queue to this file would be chaos
- No routing means no shareable deep links — sharing an app is impossible today (violates core principle #3)
- The rating system accepts unlimited anonymous ratings with zero fraud protection
- Submissions insert directly into `adil_app_submissions` with client-side-only validation — any attacker can spam the table
- No auth means no developer identity, which means no developer portal, no review responses, no accountability
- The hero app rotation is purely day-of-year modulo with no real curation signal
- CSS is entirely global — any future component will fight every other component

**What needs replacing entirely:**
- The single-file architecture must go. Not refactorable — replace with Next.js 14 App Router
- The hardcoded FALLBACK_APPS array embedded in HTML should become a Supabase-seeded table
- The anonymous-everything ratings system needs verified install requirement before v1 ships

---

### Confirmed backend: Supabase

| Table | Status |
|---|---|
| `adil_apps` | Exists — needs extension (add `developer_id`, `updated_at`, `install_count`, `ranking_score`) |
| `adil_app_ratings` | Exists — needs extension (add `user_id`, `is_verified_install`, `helpful_count`, `developer_reply`) |
| `adil_app_submissions` | Exists — needs extension (add `status`, `reviewer_notes`, `reviewed_by`, `reviewed_at`) |
| `adil-icons` (storage) | Exists |
| `users` / auth | Not yet configured |
| `developer_profiles` | Does not exist |
| `app_versions` | Does not exist |
| `installs` | Does not exist |
| `share_links` | Does not exist |
| `reports` | Does not exist |
| `audit_logs` | Does not exist |

---

### Security vulnerabilities (real, not theoretical)

1. **Unlimited anonymous ratings** — anyone can call `supabase.from("adil_app_ratings").insert(...)` infinite times. A competitor can flood any app with 1-star ratings. There is no rate limiting, no IP check, no captcha, no verified-install requirement.

2. **Submission spam** — `adil_app_submissions` accepts unlimited inserts from any anonymous client. No honeypot, no rate limit, no CAPTCHA equivalent.

3. **No RLS validation confirmed** — the code assumes RLS policies exist but they are not documented. If `adil_apps` has no RLS, any client can insert or update apps.

4. **XSS via innerHTML** — `createAppCard()` and `renderHeroApp()` build HTML strings by interpolating `app.name`, `description`, `tags`, etc. directly into `innerHTML`. If Supabase ever returns user-controlled data in those fields, this is an XSS vector. The fallback apps are safe, but submitted apps processed through admin queue and then published could be exploited.

5. **No Content Security Policy** — no CSP header, no meta CSP. The `esm.sh` import is a supply chain risk.

---

### Missing infrastructure for a production app store

- No auth or user accounts
- No developer identity or developer portal
- No app versioning
- No install tracking (makes fair ranking impossible)
- No share links or deep links (URLs like `adilstore.com/app/unmask`)
- No PWA manifest (can't install the store itself)
- No admin review interface
- No moderation tooling
- No CI/CD pipeline
- No error monitoring (Sentry or equivalent)
- No performance budget or Lighthouse targets
- Zero tests (unit, integration, E2E)
- No semantic versioning of the app
- No changelog

---

### Code quality and test coverage

- **Tests:** Zero. None. Not even a smoke test.
- **TypeScript:** Not used. Pure vanilla JS with no type checking.
- **Linting:** No ESLint, no Prettier.
- **Accessibility:** Better than average for a solo project — ARIA labels present, keyboard nav considered, `prefers-reduced-motion` respected. But no automated a11y audit.
- **Performance:** The single HTML file loads fast because it is a single file. After a refactor to Next.js, this advantage must be preserved — static generation for the home page is non-negotiable.

---

## STEP 2 — Phased Roadmap

### Phase 1: Foundation (Months 0–3)

Goal: Make AdilStore trustworthy and stable enough for real developers to submit apps and real users to trust it.

**Must deliver:**
- Next.js 14 App Router + TypeScript + Tailwind CSS (replacing the monolith)
- Supabase Auth — email/password + OAuth (Google), developer and user roles
- App detail page with SEO-friendly URL (`/app/[slug]`)
- Developer onboarding flow (account creation, profile, basic verification signal)
- App submission pipeline v1 (form, file upload, metadata, screenshots)
- Manual review queue (admin UI to approve/reject submissions)
- Extended database schema (see Step 4)
- Rudimentary search (name + category)
- Basic share link per app (`adilstore.com/app/[slug]`)
- PWA manifest + service worker (installable store)
- Migrate existing 47 apps into Supabase with proper schema

---

### Phase 2: Differentiation (Months 3–6)

Goal: Build the features that make AdilStore meaningfully better than Google Play.

**Must deliver:**
- Fair Ranking Algorithm v1 (see Step 4)
- Install event tracking (privacy-preserving — no fingerprinting, no PII)
- Share link system with install attribution (privacy-safe)
- QR code generation per app (client-side)
- Developer Portal v1: dashboard, submit update flow, respond to reviews
- Trust & Reviews System: verified install requirement, helpfulness voting, developer replies, abuse detection
- Transparent moderation log

---

### Phase 3: Scale & Polish (Months 6–12)

Goal: Compete on surface quality with incumbent app stores.

**Must deliver:**
- Search v2: full-text with Postgres `tsvector`, fuzzy match, filter by rating/installs/updated
- App categories with curated collections (human-edited)
- Developer Analytics v2: retention curves, geographic spread (privacy-safe), device breakdown
- i18n foundation (add 3rd language, extract all strings to structured files)
- Performance: Lighthouse score ≥90 across all metrics, cold load under 2s on 4G
- Binary/app scanning approach (VirusTotal API for APKs, manual checklist for web apps)
- PWA improvements: offline shell, background sync
- Community features: user-curated lists

---

## STEP 3 — Prioritized Backlog

### Phase 1 Tasks

**[TASK-001] Replace monolith with Next.js 14 App Router**
- What: Scaffold Next.js 14 + TypeScript + Tailwind, move all existing functionality into components and pages, preserve existing visual design exactly
- Why: The single-file architecture is the root cause of every scalability problem. Routing is required for shareable deep links. Server-side rendering is required for SEO. Component separation is required for maintainability.
- Acceptance Criteria: Home page renders identical to current `index.html` including search, category filters, featured row, and app grid. All existing Supabase queries work. Lighthouse performance score ≥85.
- Effort: L
- Depends on: none

**[TASK-002] Configure Supabase Auth with roles**
- What: Enable Supabase Auth with email/password and Google OAuth. Create `user_roles` table with roles: `user`, `developer`, `admin`. Set up email verification flow.
- Why: Every downstream feature — developer portal, verified reviews, moderation — requires knowing who is acting.
- Acceptance Criteria: User can sign up, verify email, log in, and log out. Developer role can be requested. Admin role is assigned manually. Protected pages return 401 for unauthenticated requests.
- Effort: M
- Depends on: TASK-001

**[TASK-003] Full database schema migration**
- What: Run SQL migrations to extend existing tables and create new ones: `developer_profiles`, `app_versions`, `installs`, `share_links`, `reports`, `audit_logs`, `categories`. Add missing columns to existing tables.
- Why: The current 3-table schema has no developer identity, no versioning, no install tracking, no share links. Nothing in Phase 2 is buildable without this.
- Acceptance Criteria: All tables exist with correct columns, types, constraints, and RLS policies. Foreign keys enforce referential integrity. Indexes exist on all commonly queried columns.
- Effort: M
- Depends on: none (runs in Supabase directly)

**[TASK-004] App detail page with SEO and deep links**
- What: Build `/app/[slug]` page. Server-side rendered. Shows icon, name, description, tags, platforms, screenshots, ratings, and a prominent "Open App" CTA. Include Open Graph + Twitter Card meta tags.
- Why: Without a shareable URL per app, sharing is impossible — which violates core principle #3. Google cannot index apps without individual pages.
- Acceptance Criteria: `/app/unmask` renders with correct content. Open Graph tags visible to link preview scrapers. Page loads in <1.5s on desktop. URL is copyable and opens correctly when shared.
- Effort: M
- Depends on: TASK-001, TASK-003

**[TASK-005] Developer onboarding flow**
- What: `/developer/signup` page. After auth, developer completes profile: display name, website, contact email, brief bio. Store in `developer_profiles`. Send confirmation email.
- Why: Zero accountability in the current system — anyone can submit anything. Developer identity is the foundation of the trust model.
- Acceptance Criteria: Developer can complete profile. Profile is linked to Supabase Auth user. Developer role is assigned post-completion. Incomplete profiles cannot submit apps.
- Effort: M
- Depends on: TASK-002, TASK-003

**[TASK-006] App submission pipeline v1**
- What: `/developer/apps/submit` form. Fields: name, URL, category, description (EN + optionally TR), tags, platforms, screenshots (up to 5 images), icon upload, contact. Stores in `adil_app_submissions` with `status = 'pending'`.
- Why: Developers currently submit via an anonymous public form with no accountability. This must be tied to an authenticated developer profile.
- Acceptance Criteria: Only authenticated developers can access the form. All uploads go to Supabase Storage. Submissions appear in the admin review queue. Developer sees submission status in their dashboard. Files validated client-side (size, type) and server-side.
- Effort: M
- Depends on: TASK-005, TASK-003

**[TASK-007] Admin review queue**
- What: `/admin/review` page (role-gated). Lists pending submissions with all metadata and uploaded files. Reviewer can approve (creates entry in `adil_apps` table), reject with reason, or request changes. All actions logged to `audit_logs`.
- Why: Manual review is the only guard between malicious submissions and published apps. Must exist before any external developer can submit.
- Acceptance Criteria: Admin can view, approve, and reject submissions. Approved apps appear in the store. Rejected apps send email to developer with reason. All review actions recorded with actor ID, timestamp, and notes.
- Effort: L
- Depends on: TASK-006, TASK-002

**[TASK-008] Basic share links**
- What: Every app gets a canonical URL at `/app/[slug]`. Add a "Share" button on the app card and detail page that copies the URL to clipboard and optionally triggers the Web Share API on mobile.
- Why: Sharing is core principle #3. The simplest version is just a copyable URL. Must exist in Phase 1.
- Acceptance Criteria: Share button visible on every app. Copies correct URL. Web Share API fires on supported mobile browsers. URL resolves to correct app detail page.
- Effort: S
- Depends on: TASK-004

**[TASK-009] Migrate FALLBACK_APPS to Supabase seed**
- What: Write a Supabase migration seed file that inserts all 47 existing apps from FALLBACK_APPS into the `adil_apps` table with proper schema mapping.
- Why: The hardcoded array in HTML is not maintainable. All app data should live in the database.
- Acceptance Criteria: All 47 apps exist in `adil_apps` with correct slugs, categories, descriptions, tags, and `is_published = true`. The FALLBACK_APPS array is removed from the HTML (or kept only as offline emergency fallback).
- Effort: S
- Depends on: TASK-003

**[TASK-010] PWA manifest and installability**
- What: Add `manifest.json`, service worker with offline shell caching, and appropriate meta tags. The store itself should be installable on Android via PWA.
- Why: If we're competing with app stores, the store must itself be installable without going through an app store. This also enables Add to Home Screen on mobile.
- Acceptance Criteria: Lighthouse PWA score ≥90. Chrome shows "Install App" prompt. Offline shell renders when network is unavailable. App icons display correctly on home screen.
- Effort: S
- Depends on: TASK-001

**[TASK-011] Protect ratings from spam**
- What: Add rate limiting to rating inserts (1 rating per app per IP per 24h, enforced via Supabase Edge Function). Add honeypot field to submission form.
- Why: The current system allows unlimited fake ratings. This undermines the trust model before it can begin.
- Acceptance Criteria: Duplicate IP+app rating within 24h returns error. Honeypot-triggered submissions are silently discarded. Rate limit does not affect legitimate use.
- Effort: M
- Depends on: TASK-003

**[TASK-012] Developer dashboard stub**
- What: `/developer/dashboard` page. Shows developer's submitted apps, their status (pending/approved/rejected), basic stats (rating count, star average). Navigation to submit new app and manage existing.
- Why: Developers need visibility into their submissions. Without a dashboard, the portal feels like a black hole.
- Acceptance Criteria: Only accessible to developers. Shows all apps submitted by logged-in developer. Status is up-to-date with review queue outcomes.
- Effort: M
- Depends on: TASK-007, TASK-005

---

### Phase 2 Tasks (Directional)

**[TASK-013] Install event tracking (privacy-preserving)**
- What: Track installs without PII. Hash the user-agent + coarse timestamp (daily bucket) to create a pseudonymous identifier. Store `app_id`, `install_source`, `share_link_id`, `user_agent_hash`, `created_at`. No IP storage.
- Effort: M — Depends on: TASK-003

**[TASK-014] Fair Ranking Algorithm v1**
- What: Implement the scoring formula (see Step 4). Run as a Supabase scheduled Edge Function every 6 hours. Store computed `ranking_score` on the `adil_apps` table.
- Effort: L — Depends on: TASK-013

**[TASK-015] Share link system with attribution**
- What: Each app gets a unique share URL (`/s/[token]`). On visit, record the install event with `install_source = 'share_link'`, then redirect to the app. Token generated server-side.
- Effort: M — Depends on: TASK-013

**[TASK-016] QR code generation**
- What: Client-side QR code for each app URL using a lightweight library (qrcode.js). Available on app detail page and in developer dashboard.
- Effort: S — Depends on: TASK-004

**[TASK-017] Verified-install reviews**
- What: Review submission only available to users with a logged install event for that app. Existing anonymous ratings migrated or grandfathered as "unverified".
- Effort: M — Depends on: TASK-013

**[TASK-018] Developer portal v1 (full)**
- What: Full developer dashboard with install charts, rating breakdown, version history, update submission flow, and review response capability.
- Effort: L — Depends on: TASK-012, TASK-013

**[TASK-019] Report flow + moderation**
- What: Users can report an app (categories: malware, spam, privacy violation, misleading description). Reports go to admin queue. Moderation log is public (what was removed and why).
- Effort: M — Depends on: TASK-007

**[TASK-020] Anti-gaming detection**
- What: Supabase Edge Function that flags suspicious install spikes (>3x 7-day moving average), review clusters from same subnet, and review bursts within 1 hour. Flagged apps enter manual review.
- Effort: L — Depends on: TASK-014

---

### Phase 3 Tasks (Directional)

**[TASK-021] Full-text search with tsvector**
- Effort: M — Depends on: TASK-003

**[TASK-022] Developer analytics v2**
- Effort: L — Depends on: TASK-018

**[TASK-023] Curated collections**
- Effort: M — Depends on: TASK-001

**[TASK-024] App binary scanning**
- Effort: L — Depends on: TASK-007

**[TASK-025] i18n v2 (3rd language + structured files)**
- Effort: M — Depends on: TASK-001

**[TASK-026] Performance audit + cold load <2s**
- Effort: M — Depends on: TASK-001

---

## STEP 4 — Technical Recommendations

### Database Schema (Supabase / PostgreSQL)

```sql
-- CATEGORIES (replaces hardcoded CATEGORY_ORDER)
CREATE TABLE categories (
  id          text PRIMARY KEY,  -- 'spiritual', 'games', etc.
  name_en     text NOT NULL,
  name_tr     text,
  sort_order  int NOT NULL DEFAULT 0,
  icon        text              -- emoji or icon name
);

-- DEVELOPER PROFILES (linked to Supabase Auth users)
CREATE TABLE developer_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name    text NOT NULL,
  website         text,
  bio             text,
  contact_email   text NOT NULL,
  is_verified     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_developer_profiles_user_id ON developer_profiles(user_id);

-- APPS (extends existing adil_apps)
CREATE TABLE apps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  category_id     text REFERENCES categories(id),
  developer_id    uuid REFERENCES developer_profiles(id),
  url             text NOT NULL,
  preview_url     text,
  description_en  text NOT NULL,
  description_tr  text,
  tags_en         text[] DEFAULT '{}',
  tags_tr         text[] DEFAULT '{}',
  platforms_en    text[] DEFAULT '{}',
  platforms_tr    text[] DEFAULT '{}',
  icon_filename   text,
  screenshots     text[] DEFAULT '{}',   -- storage paths
  is_published    boolean DEFAULT false,
  is_featured     boolean DEFAULT false,
  is_external     boolean DEFAULT false,
  sort_order      int DEFAULT 0,
  install_count   bigint DEFAULT 0,
  ranking_score   numeric(10,6) DEFAULT 0,
  version         text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_apps_slug ON apps(slug);
CREATE INDEX idx_apps_category_id ON apps(category_id);
CREATE INDEX idx_apps_ranking_score ON apps(ranking_score DESC) WHERE is_published = true;
CREATE INDEX idx_apps_developer_id ON apps(developer_id);

-- APP VERSIONS
CREATE TABLE app_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id          uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  version         text NOT NULL,
  changelog_en    text,
  changelog_tr    text,
  url             text,
  is_current      boolean DEFAULT false,
  released_at     timestamptz DEFAULT now()
);
CREATE INDEX idx_app_versions_app_id ON app_versions(app_id);

-- INSTALLS (privacy-preserving, no PII)
CREATE TABLE installs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id          uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  install_source  text CHECK (install_source IN ('direct','share_link','search','featured','category')) DEFAULT 'direct',
  share_link_id   uuid,
  -- No IP stored. user_agent_hash is SHA-256 of (user_agent + date_bucket), no PII.
  user_agent_hash text,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_installs_app_id ON installs(app_id);
CREATE INDEX idx_installs_created_at ON installs(created_at);
CREATE INDEX idx_installs_app_created ON installs(app_id, created_at);

-- REVIEWS (extends existing adil_app_ratings)
CREATE TABLE reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id              uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  user_id             uuid REFERENCES auth.users(id),
  nickname            text,
  score               smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment             text,
  is_verified_install boolean DEFAULT false,
  helpful_count       int DEFAULT 0,
  is_published        boolean DEFAULT true,
  developer_reply     text,
  developer_reply_at  timestamptz,
  created_at          timestamptz DEFAULT now()
);
CREATE INDEX idx_reviews_app_id ON reviews(app_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE UNIQUE INDEX idx_reviews_user_app ON reviews(user_id, app_id) WHERE user_id IS NOT NULL;

-- REPORTS
CREATE TABLE reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id          uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  reporter_id     uuid REFERENCES auth.users(id),
  reason          text NOT NULL CHECK (reason IN ('malware','spam','privacy','misleading','other')),
  description     text,
  created_at      timestamptz DEFAULT now(),
  resolved        boolean DEFAULT false,
  resolution_note text,
  resolved_by     uuid REFERENCES auth.users(id),
  resolved_at     timestamptz
);
CREATE INDEX idx_reports_app_id ON reports(app_id);

-- SHARE LINKS
CREATE TABLE share_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id          uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  token           text UNIQUE NOT NULL,   -- short random slug, e.g. 'x7kp2m'
  source_hint     text,                   -- 'twitter', 'whatsapp', 'qr', etc.
  install_count   bigint DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_app_id ON share_links(app_id);

-- APP SUBMISSIONS (extends existing adil_app_submissions)
CREATE TABLE app_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id    uuid REFERENCES developer_profiles(id),
  app_name        text NOT NULL,
  app_url         text NOT NULL,
  category_id     text REFERENCES categories(id),
  description_en  text,
  description_tr  text,
  contact_email   text NOT NULL,
  extra_notes     text,
  icon_path       text,
  screenshots     text[] DEFAULT '{}',
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','needs_changes')),
  reviewer_notes  text,
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_app_submissions_status ON app_submissions(status);
CREATE INDEX idx_app_submissions_developer_id ON app_submissions(developer_id);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        uuid REFERENCES auth.users(id),
  action          text NOT NULL,          -- 'app.approve', 'app.reject', 'review.remove', etc.
  resource_type   text NOT NULL,
  resource_id     uuid,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**Row Level Security policies:**
```sql
-- Apps: public read for published, developer write for own apps
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published apps" ON apps FOR SELECT USING (is_published = true);
CREATE POLICY "Developers manage own apps" ON apps FOR ALL
  USING (developer_id = (SELECT id FROM developer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin full access" ON apps FOR ALL
  USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');

-- Reviews: public read published, auth write (one per app per user)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published reviews" ON reviews FOR SELECT USING (is_published = true);
CREATE POLICY "Auth users insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users update own reviews" ON reviews FOR UPDATE USING (user_id = auth.uid());

-- Installs: insert-only for anon
ALTER TABLE installs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record install" ON installs FOR INSERT WITH CHECK (true);
```

---

### Fair Ranking Algorithm — Concrete Proposal

```
ranking_score = (
  install_velocity_7d   * 0.20  +
  retention_signal_7d   * 0.25  +
  review_score_bayesian * 0.20  +
  update_recency        * 0.15  +
  report_penalty        * 0.15  +
  developer_response    * 0.05
) * anti_gaming_multiplier
```

**Factor definitions:**

| Factor | Definition | Weight | Rationale |
|---|---|---|---|
| `install_velocity_7d` | `installs_last_7d / (installs_all_time + 1)`, clipped to [0,1] | 0.20 | Measures current momentum without rewarding legacy apps just for age |
| `retention_signal_7d` | `installs_last_7d_with_return_visit / installs_last_7d`, where "return" = same `user_agent_hash` within 7d | 0.25 | The single best signal of real value — users coming back |
| `review_score_bayesian` | `(C * m + Σscores) / (C + n)` where C=10 (prior count), m=3.5 (prior mean), n=review count | 0.20 | Bayesian average prevents new apps with 1 review from unfairly dominating |
| `update_recency` | `max(0, 1 - days_since_last_update / 180)` | 0.15 | Decays linearly to 0 over 6 months — rewards active maintenance |
| `report_penalty` | `max(0, 1 - (report_count * 2 / (installs + 1)))` | 0.15 | Penalizes reported apps proportional to install base size |
| `developer_response` | `replies / max(10, review_count)`, clipped to [0,1] | 0.05 | Small signal encouraging developer engagement |

**Anti-gaming rules:**
1. **Install spike detection**: If 7-day installs exceed 3× the 30-day moving average, flag the app for review and cap `install_velocity_7d` at the 30-day average during investigation
2. **Review clustering**: If >20% of reviews for an app arrive within the same 1-hour window from similar user agents, mark as suspicious and exclude from score calculation
3. **No factor is purchasable**: The ranking function is open-source and immutable. No "promoted listing" field exists in the schema.
4. **Score recomputation**: Runs as a Supabase Edge Function every 6 hours. Historical scores are logged to allow audit.

**Implementation (TypeScript):**
```typescript
// See src/lib/ranking.ts
```

---

### Sharing & Install Flow — Technical Spec

**URL structure:**
- Canonical app page: `adilstore.com/app/[slug]`  e.g. `adilstore.com/app/unmask`
- Share redirect: `adilstore.com/s/[6-char-token]` — records install attribution, then redirects to canonical page
- QR codes point to the share redirect URL, not the canonical URL (for attribution tracking)

**Slug generation:**
```typescript
// Slug from app name: kebab-case, ASCII, deduplicated
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Share token: 6 random chars from url-safe alphabet
function generateToken(): string {
  return crypto.getRandomValues(new Uint8Array(6))
    .reduce((acc, b) => acc + 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36], '');
}
```

**Deep link flow:**
1. User visits `adilstore.com/s/x7kp2m`
2. Next.js server component looks up `share_links` by token
3. Increments `install_count` on `share_links`
4. Inserts into `installs` with `install_source = 'share_link'`
5. Redirects to `/app/[slug]`

**PWA manifest requirements:**
```json
{
  "name": "AdilStore",
  "short_name": "AdilStore",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#020617",
  "background_color": "#020617",
  "icons": [
    { "src": "/adilstore-icon.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/adilstore-icon.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**Install tracking (privacy-preserving):**
- Never store raw IP addresses
- Never store full user agents
- `user_agent_hash = SHA-256(user_agent + date_bucket)` where `date_bucket = YYYY-MM-DD`
- This allows deduplication within a day without tracking across days
- No cookies, no localStorage used for tracking
- Clear opt-out: users can block by not allowing JavaScript (store degrades gracefully)

**QR generation:**
- Client-side using `qrcode` npm package (no server round-trip, no data sent to third party)
- Generates QR for the share redirect URL (with token for attribution)
- Available on app detail page and in developer dashboard

---

### Security Model for App Submissions

**Metadata validated on submission:**
- URL must be a valid HTTPS URL
- App name: 3–100 chars, no HTML tags
- Description: 50–2000 chars
- Category must be a valid category ID
- Email must be valid format
- Icon: JPEG/PNG only, max 2MB, dimensions between 64×64 and 1024×1024
- Screenshots: JPEG/PNG only, max 5MB each, up to 5 images

**Manual review checklist (what reviewers must verify):**
1. Visit the app URL — does it load and work?
2. Is it actually ad-free? (check for AdSense, pop-ups, interstitials)
3. Does it collect data not disclosed in the description?
4. Does it request unnecessary permissions?
5. Is the description honest? Does the app do what it says?
6. Is it appropriate for the claimed category?
7. Is it a duplicate of an existing listing?
8. Is the developer identity plausible? (real email domain, not throwaway)

**Escalation to automated scanning:**
1. Phase 1: Manual-only. Reviewer visits the app URL in a sandboxed browser.
2. Phase 2: For APK submissions, integrate VirusTotal API (`POST /files`). If VT score ≥ 1 engine flags it, auto-flag for senior review.
3. Phase 3: Automated content scan via Lighthouse CI for performance and security headers. Apps scoring below threshold require explanation.

**Developer ban/appeal process:**
1. Strike 1: Warning + mandatory app update within 14 days
2. Strike 2: App unpublished + developer notified with specific violations
3. Strike 3: Developer account suspended
4. Appeal: Email to `appeals@adilstore.com`. Human review within 5 business days. Outcome logged to `audit_logs`. Final decisions published in transparency report.

---

### Supabase-Specific Architecture Advice

**Use these Supabase features:**
- **Auth**: Email/password + OAuth (Google). Use `@supabase/ssr` with Next.js Server Components for server-side session management.
- **Storage**: Two buckets — `app-icons` (public read) and `app-screenshots` (public read). Use server-side upload from Next.js API routes to avoid exposing service role key.
- **Edge Functions**: Use for ranking score computation (scheduled), install event processing, and rate limiting.
- **Realtime**: Use for the admin review queue to show new submissions without page refresh. Do not use for public-facing pages (not needed).
- **Row Level Security**: Every table must have RLS enabled. No exceptions. Verify policies with `supabase inspect db rls`.

**Where current setup hits free tier limits:**
- Supabase free tier: 500MB database, 1GB storage, 50K monthly active users
- At scale: install events table grows fast. Partition by month. Archive old rows to cold storage after 90 days.
- Edge Functions: 500K invocations/month free. Ranking function runs every 6 hours = ~120/month. No concern.
- Realtime: 200 concurrent connections free. Admin queue uses this — fine for team size.

**Vendor lock-in risks:**
- Supabase is open-source (PostgreSQL under the hood). You can self-host if needed.
- The auth system uses JWTs compatible with standard PKCE flows — migration to another auth provider is feasible.
- Storage is S3-compatible API — files can be moved to Cloudflare R2 or AWS S3 without code changes beyond URL configuration.
- The biggest lock-in is Edge Functions (Deno runtime). If you ever need to migrate, rewrite these as standard Next.js API routes first.
- **Recommendation:** Keep business logic in Next.js API routes where possible. Use Supabase Edge Functions only for scheduled tasks and database-proximate operations.

---

## STEP 5 — What NOT to Build (Yet)

**Do not build these. Not because they're bad ideas — because building them now will slow you down, compromise your values, or distract from the four core gaps.**

**1. Monetization / paid tiers / developer fees**
Building a payment layer now forces legal, compliance, and support overhead before you have the product-market fit to justify it. More importantly, any revenue model that touches rankings risks polluting the zero-pay-to-win guarantee. Defer until you have 500+ apps and organic developer demand.

**2. In-app purchase infrastructure**
This requires working with payment providers, stores, and potentially Google Play APIs. It's a months-long project and has nothing to do with the current gaps. Do not touch it.

**3. iOS App Store competition**
Android-first is the right call. iOS requires a macOS developer machine, $99/year Apple developer account, App Store Review compliance, and TestFlight for beta. The web-first PWA approach already covers iOS users for web apps. Do not open an iOS development track until you have 1,000 daily active users.

**4. Social feed / activity stream**
A "what your friends installed" feed requires social graph infrastructure, content moderation at scale, and creates engagement-maximization pressure that runs counter to your values. You are explicitly not building the next TikTok.

**5. Gamification / achievement badges**
Badges for "top reviewer" or "early adopter" create perverse incentives for review spam. They also take engineering time away from real trust features like verified installs.

**6. AI app recommendations**
An AI recommendation engine requires training data (installs, sessions, clicks) you don't have yet. Premature algorithmic curation also risks the same manipulation vectors you're trying to avoid from Google Play and Apple. Human-edited collections first.

**7. Native Android app shell (before PWA is solid)**
The PWA must work reliably first. A native shell that wraps a broken PWA is worse than no native shell. Do not start a Flutter or React Native wrapper until the web app has a Lighthouse PWA score of 90+.

**8. Developer monetization analytics (ARPU, LTV, etc.)**
These metrics encourage developers to optimize for extraction rather than value. Never build them. If a developer asks for these metrics specifically, that's a signal they may not be the right fit for AdilStore.

**9. Promotional placements (even "free featured slots")**
The moment you introduce a "featured slot" request system — even free — you create the social expectation that paying (later) earns featuring. Do not build any mechanism that lets developers request preferential visibility.

**10. Review import from Google Play**
Tempting for seeding content, but Google Play reviews were written for a different context, include Play-specific feedback ("crashes on my Samsung"), and importing them without user consent is an ethical gray area. Build genuine reviews from scratch.
