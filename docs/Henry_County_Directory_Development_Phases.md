# Henry County Directory — Antigravity Prompts

Companion file to `Henry_County_Directory_Development_Phases.md`. Use these prompts when working with the AI agent in Antigravity IDE. Copy/paste and adjust as needed — attach the reference UI image wherever noted.

---

## Setup: Save the Reference Image First

Before starting, save the reference homepage screenshot into the repo at:
```
/design/reference-homepage.jpg
```
This gives the agent a persistent file to re-open across sessions, instead of relying on it being shown once in chat.

---

## Prompt 1 — Extract the Design System (run once, at project start)

*Attach the reference image with this prompt.*

> Here's the reference UI for our directory site, "Henry County Directory." Study this image and extract a Tailwind design-tokens config: color palette (primary accent, backgrounds, text), typography scale (headline/subheading pairing), spacing/border-radius conventions for cards and buttons, and the shape of the search bar. Save this as `/design/tokens.md` and a matching `tailwind.config.ts`. Every page you build afterward should visually match this reference — reuse these tokens, don't invent new ones.
>
> Reference values to anchor on: accent `#E8505B`, off-white backgrounds, charcoal text, bold sans-serif headline paired with a light-weight subheading, pill-shaped search bar, icon-grid category browser, card-based listings with status badges (Featured/Best Rate/Most View/Ad), star ratings, avatar-based testimonials.

---

## Prompt 2 — Phase 0: Project Setup

> Set up the project per Phase 0 in `DEVELOPMENT_PLAN.md`: init Next.js (App Router, TypeScript, Tailwind), connect to Supabase, configure the design tokens from `/design/tokens.md`, set up Vercel deployment. Confirm each Exit Criteria item before marking the phase done.

---

## Prompt 3 — Phase 1: Schema, RLS, Auth (no image needed — backend only)

> Implement Phase 1 from `DEVELOPMENT_PLAN.md`: create the full schema (all tables listed, with `tenant_id` and enums as specified), write RLS policies, and implement Supabase Auth (signup/login/reset/OTP). Don't build any UI yet beyond bare test forms. Check off each task as you complete it.

---

## Prompt 4 — Phase 2: Public Directory Core (attach the image again)

> Here's the reference UI again. Build Phase 2 from `DEVELOPMENT_PLAN.md`: homepage hero with the What/Where pill search bar, icon-grid category browser, featured destinations carousel, and "How It Works" section — matching this reference's layout and the tokens in `/design/tokens.md`. Then build category pages, city pages, and the listing detail page.

---

## Prompt 5 — Phase 3: Cold Lead Pipeline (backend/logic-heavy)

> Implement Phase 3 from `DEVELOPMENT_PLAN.md`: the CSV import Edge Function (validate, geocode, category-guess, duplicate-flag), the GHL sync function, and the claim flow (OTP primary path + admin-review fallback + optional soft-claim). Build a minimal admin UI just for triggering/testing the import. Confirm Exit Criteria with a sample CSV of at least 10 rows.

---

## Prompt 6 — Phase 4: Owner Dashboard v1

> Build Phase 4 from `DEVELOPMENT_PLAN.md`: the owner dashboard shell, listing edit form, realtime lead inbox (synced with GHL), Q&A management, and review management. Match the design tokens from `/design/tokens.md` — the dashboard should feel like the same product as the public site, not a separate visual system.

---

## Prompt 7 — Phase 5: Visitor Engagement

> Build Phase 5 from `DEVELOPMENT_PLAN.md`: favorites, compare listings, deals/coupons feed, local events calendar, social sharing, email digest opt-in, and user-generated curated lists. Reuse existing card/list components and design tokens rather than creating new styles.

---

## Prompt 8 — Phase 6: Monetization (Stripe)

> Implement Phase 6 from `DEVELOPMENT_PLAN.md`: Stripe products/prices, Checkout flow from the owner dashboard, the webhook Edge Function that updates `subscriptions`/`addon_purchases` and flips `plan_tier`/`is_featured`, feature-gating by `plan_tier` via one shared access-check function, the referral program, and billing management page. Confirm the Exit Criteria: a test upgrade should immediately reflect on the public listing.

---

## Prompt 9 — Phase 7: Advanced Owner Tools (attach image if relevant, e.g. review widget/cards)

> Build Phase 7 from `DEVELOPMENT_PLAN.md`: booking calendar, integrated messaging inbox, competitor benchmark teaser, QR code generator, embeddable review widget, AI description writer, AI review-reply suggestions, and AI lead qualification tagging.
>
> Note: there's no direct reference for a booking calendar in the source image — extend the existing design tokens and card style to build one that feels consistent with the rest of the site.

---

## Prompt 10 — Phase 8: Admin Dashboard

> Build Phase 8 from `DEVELOPMENT_PLAN.md`: CSV import history/logs, duplicate merge tool, claim review queue, listing/review/Q&A moderation, fraud/spam flags, category/city/tenant management, featured/ad slot management, best-of list curation, referral tracking, A/B testing hooks, platform analytics, and audit log viewer. This is an internal tool — prioritize clarity and speed of use over matching the public-site brand exactly, but stay within the same design-tokens system for consistency.

---

## Prompt 11 — Phase 9: SEO Scale-Up

> Implement Phase 9 from `DEVELOPMENT_PLAN.md`: auto-generated city/neighborhood pages, category × city matrix pages, "Best of" roundup pages, expanded blog/guest posts, indexable deals feed, and full sitemap automation. Confirm structured data (schema.org LocalBusiness) is present on all listing and roundup pages.

---

## Prompt 12 — Phase 10: Deploy & Harden

> Implement Phase 10 from `DEVELOPMENT_PLAN.md`: confirm production env vars and DNS, add rate limiting on sensitive Edge Functions (OTP, claims, CSV import, reviews/leads), wire up error monitoring, set a Postgres backup policy, and load-test key public pages.

---

## Prompt 13 — Phase 11: Polish

> Implement Phase 11 from `DEVELOPMENT_PLAN.md`: PWA manifest/service worker, push notifications, notification preferences UI, performance pass (Core Web Vitals, image optimization, caching), i18n routing groundwork, and an accessibility pass.

---

## Prompt 14 — Phase 13: Finalization & QA (run after all functional phases are complete)

> All phases in `DEVELOPMENT_PLAN.md` are functionally complete. Before launch, do a full finalization pass across the entire site (public pages, owner dashboard, admin dashboard). Go through each of the following systematically and report findings before fixing, so I can review scope:
>
> **1. Error handling**
> - Every Supabase/Edge Function call has try/catch with a user-facing fallback (no raw errors, no blank screens, no silent failures)
> - Form validation on every input (signup, login, listing edit, lead form, review form, CSV import) with clear inline error messages
> - Network failure states (offline, timeout, 500s) show a retry option, not a dead page
> - 404 and 500 pages are branded, not default Next.js/Vercel error screens
>
> **2. Performance**
> - Run Lighthouse on homepage, category page, listing detail page, and owner dashboard — target 90+ on Performance, Accessibility, Best Practices, SEO
> - Audit image loading (next/image, lazy loading, proper sizing) across all listing photos/galleries
> - Check for unnecessary re-renders, oversized JS bundles, and missing caching headers
> - Confirm Supabase queries use indexes where needed (especially search/filter and city/category pages)
>
> **3. Responsiveness — all devices**
> - Test at mobile (375px), tablet (768px), laptop (1280px), and large desktop (1920px) breakpoints
> - Confirm the search bar, icon-grid, listing cards, and dashboard tables/forms reflow properly at each size — no horizontal scroll, no overlapping elements, no cut-off text
> - Test touch targets on mobile (buttons/links large enough, no accidental taps)
> - Confirm the owner and admin dashboards are usable on tablet at minimum (not just desktop)
>
> **4. Layout, interactivity, and "feel" for leads**
> - Walk through the homepage → category → listing → lead-submission flow as a first-time visitor would, and flag any point where the next action isn't obvious
> - Confirm hover/active/focus states exist on every clickable element (buttons, cards, badges) — nothing should feel static or unresponsive
> - Confirm loading states (skeletons/spinners) exist anywhere data is fetched, so the site never feels frozen
> - Check visual hierarchy on the listing detail page specifically — the lead/contact CTA should be the most visually prominent element, since that's the conversion point for the whole business
> - Confirm consistent spacing, alignment, and use of the design tokens from `/design/tokens.md` across every page — flag any component that looks inconsistent with the reference brand
>
> Report all issues found, grouped by section above, before making changes — I'll confirm priority, then proceed fix by fix.

---

## Ongoing / Re-anchoring Prompts (use periodically across long sessions)

**Design drift check:**
> Before continuing, review `/design/tokens.md` and the reference image at `/design/reference-homepage.jpg`. Confirm the last few components you built still match it. Flag anything that's drifted and fix it before moving on.

**Scope/sequence check:**
> Check `DEVELOPMENT_PLAN.md` — are we still working within the current phase, or has scope drifted into a later phase? If so, pause that work and confirm with me before continuing.

**Exit criteria check:**
> Before marking this phase complete, re-read its Exit Criteria in `DEVELOPMENT_PLAN.md` and verify each one explicitly. List what passes and what doesn't.

---

## General Rules to Remind the Agent Of
- Don't invent new colors/spacing/components outside `/design/tokens.md` — extend consistently instead.
- `tenant_id`, enums, and `analytics_events` logging (from Phase 1) must be respected in every later feature — don't bypass them for convenience.
- Treat `DEVELOPMENT_PLAN.md` as the single source of truth for scope and sequencing; treat `/design/tokens.md` + the reference image as the single source of truth for visuals.