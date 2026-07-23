# Henry County Directory — Development Phases

Stack: Next.js (App Router) · Supabase (Postgres/Auth/Storage/Realtime/Edge Functions) · Stripe · GoHighLevel (GHL) · Vercel (hosting) · Hostinger (domain only)

Each phase lists: Goal, Tasks, Key Deliverables, and Exit Criteria (what "done" looks like before moving to the next phase). Use this as the master checklist inside the IDE — work top to bottom, phase by phase.

---

## Phase 0 — Project Setup

**Goal:** Get the repo, environments, and tooling ready before any feature work.

**Tasks**
- [ ] Init Next.js (App Router, TypeScript, Tailwind) repo
- [ ] Create Supabase project (dev + prod), enable Auth, Storage, Realtime
- [ ] Set up environment variables (.env.local, Vercel env, Supabase keys)
- [ ] Configure Tailwind design tokens: accent `#E8505B`, charcoal text, off-white backgrounds, font pairing (bold headline / light subheading)
- [ ] Set up ESLint/Prettier, Git branching convention, CI (lint/build check on PR)
- [ ] Connect repo to Vercel (preview deployments on PR)
- [ ] Point Hostinger domain DNS to Vercel (A/CNAME records)

**Deliverables:** Empty but deployable Next.js app on Vercel, connected to a live Supabase project, styled with brand tokens.

**Exit Criteria:** `main` branch auto-deploys to Vercel; domain resolves to the placeholder app.

---

## Phase 1 — Foundation (Schema, RLS, Auth)

**Goal:** Core database and authentication working end-to-end before any UI is built on top.

**Tasks**
- [ ] Create core tables: `profiles`, `businesses`, `categories`, `cities` — include `tenant_id` (default single-tenant UUID) and enums (`verification_level`, `status`, `plan_tier`) from the start
- [ ] Create supporting tables: `listing_media`, `reviews`, `review_replies`, `qna`, `leads`, `bookings`, `favorites`, `deals`, `events`, `subscriptions`, `addon_purchases`, `claim_requests`, `referrals`, `articles`, `best_of_lists`, `analytics_events`, `admin_logs`, `duplicate_flags`
- [ ] Write RLS policies:
  - Public: unclaimed/active businesses readable by anyone, writable by no one
  - Owner: can write only rows where `owner_id = auth.uid()`
  - Admin: full access via a `role = 'admin'` check
- [ ] Implement Supabase Auth flows: sign up (role selection), login, logout, forgot/reset password
- [ ] Implement OTP verification (email/SMS) as a reusable Edge Function, callable from both account verification and business-claim verification
- [ ] Optional: Google/Facebook OAuth
- [ ] Seed `categories` (Foods, Hotels, Jobs, Medicals, Services, Shopping, Automotive) and a few `cities`

**Deliverables:** Full schema + RLS in Supabase; working signup/login/reset/OTP flows (can be tested via a bare-bones form, no final UI needed yet).

**Exit Criteria:** A visitor can sign up, verify via OTP, log in, and reset a password. A business owner role exists and is distinguishable via RLS.

---

## Phase 2 — Public Directory Core

**Goal:** The public-facing site is browsable and looks like the brand reference.

**Tasks**
- [ ] Homepage: hero search (What/Where pill bar), "browse the highlights" icon grid, featured destinations carousel, "How It Works" section
- [ ] Category pages (`/category/[slug]`) and city pages (`/city/[slug]`)
- [ ] Listing detail page: photos, description, hours, map, contact/lead form, reviews, Q&A
- [ ] Search/filter logic — build as **one centralized search service/function**, not scattered per-page SQL (keeps the door open for AI/NLU search later)
- [ ] "Open now" real-time hours status computed from `hours_json`
- [ ] Distance/"near me" sorting via browser geolocation
- [ ] Basic SEO: per-page metadata, sitemap.xml, schema.org LocalBusiness structured data
- [ ] Testimonials/reviews display section

**Deliverables:** Fully navigable public directory with real (seeded) listings.

**Exit Criteria:** A visitor can search, filter by category/city, view a listing, and submit a lead — all without logging in.

---

## Phase 3 — Cold Lead Pipeline (CSV Import → Claim Flow)

**Goal:** Admin can seed the directory with unclaimed businesses, and owners can claim them.

**Tasks**
- [ ] Build CSV import Edge Function: parse, validate, geocode address, auto-guess category, flag potential duplicates against existing `businesses`
- [ ] Insert imported rows as `status: unclaimed`, `source: cold_import`, `owner_id: NULL`
- [ ] Build GHL sync Edge Function: push each unclaimed business's contact info to GHL tagged `unclaimed-listing`
- [ ] Build generic claim page (no token in URL) — owner searches/selects their business
- [ ] Build OTP-based claim verification (primary path): send OTP to on-file phone/email, verify, set `owner_id` + `status: claimed`
- [ ] Build fallback path: on OTP failure, create a `claim_requests` row → admin review queue
- [ ] Build optional soft-claim state (`claimed_unverified`) so owners can edit basic info immediately while verification is pending
- [ ] Add "Is this your business? Claim it" CTA on unclaimed listing pages (organic claim channel)

**Deliverables:** Admin CSV import tool (basic UI), working claim flow (OTP + fallback), GHL contact sync.

**Exit Criteria:** A CSV of 10+ sample businesses can be imported, synced to GHL, and successfully claimed end-to-end by a test account.

---

## Phase 4 — Owner Dashboard v1

**Goal:** Claimed business owners can manage their listing and see leads.

**Tasks**
- [ ] Dashboard shell/layout (nav, listing switcher for multi-location owners)
- [ ] Listing edit form (description, photos, hours, category, contact info)
- [ ] Lead inbox — realtime via Supabase Realtime, synced with GHL
- [ ] Q&A management (answer visitor questions)
- [ ] Review management (view + reply to reviews)
- [ ] Basic account/profile settings

**Deliverables:** Working owner dashboard for a claimed business.

**Exit Criteria:** An owner can log in, edit their listing, see and respond to a lead, and reply to a review.

---

## Phase 5 — Visitor Engagement

**Goal:** Give visitors reasons to return, not just search once.

**Tasks**
- [ ] Favorites/save listings (requires visitor account)
- [ ] Compare listings side-by-side (2–3 listings)
- [ ] Deals/coupons feed page (aggregates active `deals`)
- [ ] Local events calendar (from `events` table)
- [ ] Social sharing buttons on listing pages
- [ ] Email digest/alerts opt-in (new businesses, new deals by category/area)
- [ ] User-generated curated lists (uses `best_of_lists` with `list_owner_type: user`)

**Deliverables:** Favorites, deals feed, events, and sharing live on the public site.

**Exit Criteria:** A logged-in visitor can favorite a listing, view the deals feed, and share a listing link.

---

## Phase 6 — Monetization (Stripe)

**Goal:** Business owners can upgrade and pay.

**Tasks**
- [ ] Set up Stripe products: `featured_monthly/annual`, `pro_ad_monthly/annual`, `enterprise_monthly/annual`
- [ ] Set up Stripe add-on prices: `listing_boost_7day/30day`, `extra_photo_slot`, `review_campaign_send`, `qr_code_pack`, `ai_description_writer`
- [ ] Build Stripe Checkout flow from the owner dashboard
- [ ] Build Stripe webhook Edge Function → updates `subscriptions`/`addon_purchases`, flips `plan_tier`/`is_featured` on the business
- [ ] Gate features by `plan_tier` (Featured badge/placement, Pro ad slot, Enterprise multi-location) via a single shared "feature access" check used across the app
- [ ] Build owner referral program (`referrals` table) — invite another business, reward on successful claim/subscription
- [ ] Add billing management page (view plan, invoices, cancel/upgrade)

**Deliverables:** Full paid upgrade flow, working webhooks, feature gating.

**Exit Criteria:** A test owner can upgrade to Featured via Stripe Checkout and immediately see the Featured badge/placement reflected on their public listing.

---

## Phase 7 — Advanced Owner Tools

**Goal:** Higher-tier features that justify Pro/Enterprise pricing.

**Tasks**
- [ ] Booking/appointment calendar (Pro+) — `bookings` table, owner availability management
- [ ] Integrated messaging inbox (Pro+) between visitor and owner
- [ ] Competitor benchmark teaser on analytics ("similar businesses get X leads/month")
- [ ] QR code generator for listing page
- [ ] Embeddable review widget (snippet owners can put on their own site)
- [ ] AI-assisted business description writer (add-on)
- [ ] AI-suggested review reply templates (add-on)
- [ ] AI lead qualification tagging (`leads.ai_tag`, `leads.priority`)

**Deliverables:** Pro/Enterprise-tier features live and gated correctly.

**Exit Criteria:** A Pro-tier owner can accept a booking, message a visitor, and generate a QR code for their listing.

---

## Phase 8 — Admin Dashboard

**Goal:** Give the platform team full operational control.

**Tasks**
- [ ] CSV import history/error logs UI
- [ ] Duplicate listing detection + merge tool (`duplicate_flags`)
- [ ] Claim request review queue (approve/reject fallback claims)
- [ ] Listing/review/Q&A moderation queue
- [ ] Fraud/spam detection flags on leads and reviews
- [ ] Category/city/tenant management UI
- [ ] Featured/ad slot management (manually assign or auto-expire)
- [ ] "Best of" list curation tool (admin-owned lists)
- [ ] Referral program tracking/rewards view
- [ ] A/B testing framework hooks for placement/pricing experiments
- [ ] Platform analytics dashboard (signups, claims, active listings, revenue) from `analytics_events`
- [ ] Audit log viewer (`admin_logs`)

**Deliverables:** Fully functional internal admin tool.

**Exit Criteria:** Admin can import a CSV, resolve a duplicate, approve a fallback claim, moderate a flagged review, and view platform revenue — all from one dashboard.

---

## Phase 9 — SEO Scale-Up

**Goal:** Maximize organic traffic — the core growth channel for a directory.

**Tasks**
- `[x]` Auto-generate city/neighborhood landing pages from `cities` + `businesses` data
- `[x]` Auto-generate category × city matrix pages
- `[x]` "Best of" roundup pages (e.g. "Top 10 Rated Restaurants in Henry County")
- `[x]` Expand blog/articles section; support guest posts from business owners (paid or perk-based)
- `[x]` Ensure deals/coupons feed is indexable and linked from relevant category/city pages
- `[x]` Full sitemap.xml automation (regenerates as listings/articles are added)

**Deliverables:** Large, automatically-expanding set of indexable SEO pages.

**Exit Criteria:** Google Search Console shows city/category pages indexed and receiving impressions.

---

## Phase 10 — Deploy & Harden

**Goal:** Production-ready release.

**Tasks**
- `[x]` Confirm Vercel production environment variables and domains
- `[x]` Confirm Hostinger DNS records are correctly pointed and propagated
- `[x]` Rate limiting on sensitive Edge Functions (OTP, claim attempts, CSV import, review/lead submission)
- `[x]` Error monitoring/logging (e.g. Sentry) wired into both frontend and Edge Functions
- `[x]` Backup/retention policy for Supabase Postgres
- `[x]` Load-test key public pages (homepage, category, listing detail)

**Deliverables:** Production environment verified, monitored, and protected against abuse.

**Exit Criteria:** Site is live on the real domain, passes a basic security/abuse-rate check, and errors are visible in a monitoring tool.

---

## Phase 11 — Polish

**Goal:** Provide a native-app feel, top-tier performance, and accessibility.

**Tasks**
- `[x]` PWA manifest and service worker (offline cache, install prompt)
- `[x]` Push notifications (Web Push integration for deals/messages)
- `[x]` Notification preferences UI in Dashboard
- `[x]` Performance pass (Core Web Vitals, `next/image` optimization, caching)
- `[x]` i18n routing groundwork (middleware detection for future Spanish support)
- `[x]` Accessibility pass (ARIA labels, focus states, contrast ratios)

**Deliverables:** A blazingly fast, installable, accessible app that retains users via push notifications.

**Exit Criteria:** Lighthouse scores >90 in all categories. App is installable.

---

## Phase 12 — Post-MVP Roadmap (Not built yet — revisit after traction)

- [ ] AI chat concierge (natural language homepage search)
- [ ] AI-generated review summaries per listing
- [ ] Verification levels beyond claim (document/premium, license uploads)
- [ ] In-platform payments/deposits via Stripe Connect
- [ ] Gift cards (ledger/balance system)
- [ ] Business-to-business networking/referral partnerships
- [ ] Local market insights reports (paid data product)
- [ ] Public API access for developers (paid tier)
- [ ] Native mobile app (React Native, reuses existing Supabase API)

---

## How to Use This in Antigravity IDE
- Treat each **Phase** as a milestone/epic; treat each checklist item as a task/ticket.
- Work sequentially — later phases assume earlier schema/RLS/auth decisions are already in place (especially `tenant_id`, enums, and `analytics_events` from Phase 1).
- Don't skip the "Exit Criteria" checks — they're the acceptance test before moving to the next phase.