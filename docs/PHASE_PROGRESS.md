# Development Progress Tracker

This document tracks the completion status of the phases outlined in the `DEVELOPMENT_PLAN.md`.

## 🟢 Phase 0 — Project Setup (COMPLETED)
- [x] Init Next.js (App Router, TypeScript, Tailwind) repo
- [x] Create Supabase project, enable Auth, Storage, Realtime
- [x] Set up environment variables
- [x] Configure Tailwind design tokens
- [x] Set up ESLint/Prettier, CI

## 🟢 Phase 1 — Foundation (COMPLETED)
- [x] Create core tables (`profiles`, `businesses`, `categories`, `cities`)
- [x] Create supporting tables
- [x] Write RLS policies (Public, Owner, Admin)
- [x] Implement Supabase Auth flows
- [x] Implement OTP verification (Edge Function)
- [x] Seed categories and cities

## 🟢 Phase 2 — Public Directory Core (COMPLETED)
- [x] Homepage (hero search, featured carousel, etc.)
- [x] Category pages and city pages
- [x] Listing detail page (photos, description, map, lead form, reviews, Q&A)
- [x] Search/filter logic (centralized service)
- [x] "Open now" real-time hours status computed from `hours_json`
- [x] SEO (per-page metadata, sitemap.xml)

## 🟢 Phase 3 — Cold Lead Pipeline (COMPLETED)
- [x] CSV import Edge Function (parse, validate, duplicate flags)
- [x] Insert imported rows as `unclaimed`
- [x] GHL sync Edge Function
- [x] Generic claim page
- [x] OTP-based claim verification
- [x] Fallback claim path (admin review queue)
- [x] Soft-claim state (`claimed_unverified`)

## 🟢 Phase 4 — Owner Dashboard v1 (COMPLETED)
- [x] Dashboard shell/layout
- [x] Listing edit form (dynamic hours editor, robust location fields)
- [x] Lead inbox
- [x] Q&A management
- [x] Review management
- [x] Basic account settings

## 🟢 Phase 5 — Visitor Engagement (COMPLETED)
- [x] Favorites/save listings
- [x] Compare listings side-by-side
- [x] Deals/coupons feed page
- [x] Local events calendar structure
- [x] Social sharing buttons (Copy Link)

## 🟢 Phase 6 — Monetization (Stripe) (COMPLETED)
- [x] Set up Stripe products & add-ons
- [x] Build Stripe Checkout flow from the owner dashboard
- [x] Build Stripe webhook (update subscriptions/addons/tiers)
- [x] Gate features by `plan_tier` (Bookings, Leads Inbox, Limits)
- [x] Billing management page

## 🟡 Phase 7 — Advanced Owner Tools (PARTIALLY COMPLETED)
- [x] Booking/appointment calendar (UI lock built, core booking needs completion)
- [x] Integrated messaging inbox (UI lock built)
- [x] Feature Gates (Built limits on Leads, Photos, Descriptions)
- [ ] QR code generator for listing page
- [ ] Embeddable review widget
- [ ] AI-assisted business description writer (Addon configured, needs LLM execution)
- [ ] AI-suggested review reply templates (Addon configured, needs LLM execution)
- [ ] AI lead qualification tagging

## 🟡 Phase 8 — Admin Dashboard (PARTIALLY COMPLETED)
- [x] Basic Admin Shell
- [x] CSV import UI
- [ ] Duplicate listing merge tool
- [ ] Claim request review queue
- [ ] Listing/review/Q&A moderation queue
- [ ] Featured/ad slot management
- [ ] Platform analytics dashboard

## 🟢 Phase 9 — SEO Scale-Up (COMPLETED)
- [x] Auto-generate city/neighborhood landing pages
- [x] Auto-generate category × city matrix pages
- [x] "Best of" roundup pages
- [x] Expand blog/articles section
- [x] Deals/coupons feed indexable
- [x] Full sitemap.xml automation

## 🟢 Phase 10 — Deploy & Harden (COMPLETED)
- [x] Production environment variables
- [x] Rate limiting
- [x] Error monitoring/logging scaffolding

## 🟢 Phase 11 — Polish (COMPLETED)
- [x] PWA manifest and service worker
- [x] Push notifications setup
- [x] Notification preferences UI
- [x] Accessibility pass

---

### **Next Immediate Steps to Build:**
1. Finish the remaining **Phase 7 AI Tool integrations** (Connecting the OpenAI/Gemini API to the unlocked AI Description Writer and Review Replies).
2. Finish the **Phase 8 Admin tools** (Building the moderation queues for reviews, Q&As, and claim requests).
3. Build the actual booking creation flow inside the Bookings tab for Pro users.
