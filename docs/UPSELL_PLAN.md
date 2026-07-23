Henry County Directory — Upsell / Monetization Phase

Standalone reference for building the monetization + entitlement-enforcement layer. Pulled from the master plan (Henry_County_Directory_Development_Phases.md) — use this file on its own since the other phases are already complete.

Assumes already in place: Stripe account, businesses/profiles/subscriptions/addon_purchases tables, and the plan_tier enum (free | featured | pro_ad | enterprise) on businesses.

Goal

Business owners can upgrade and pay — and every tier's limits are actually enforced, not just implied by pricing copy.

Tier Limits (Entitlements)
Feature	Free	Featured	Pro/Ad	Enterprise
Businesses per owner account	1	1	3	Unlimited
Photos per listing	3	15	Unlimited	Unlimited
Description length	300 chars	1,000 chars	Unlimited	Unlimited
Leads per month (visible)	5 (rest blurred/locked)	Unlimited	Unlimited	Unlimited
Categories per listing	1	1	3	Unlimited
Active deals/coupons	0	1	3	Unlimited
Booking calendar	No	No	Yes	Yes
Messaging inbox	No	No	Yes	Yes
Video in gallery	No	No	Yes	Yes

Key rule: the business-count limit applies to the owner's account, counting owner-created and claimed businesses identically. A Free-tier owner with one business (however they got it) cannot add or claim a second without upgrading.

Fairness & Owner-Benefit Principles

These keep the upsell model feeling fair rather than extractive — apply them alongside the entitlement enforcement above:

Never paywall basic trust/accuracy. Editing contact info, hours, address, category correction, and responding to reviews/Q&A are always free on every tier, including Free. Only growth/visibility features (placement, extra media, extra leads, extra locations) are paywalled — not basic data accuracy.
Free trial of paid tiers. Right after claiming, an owner gets one 14–30 day free trial of Featured or Pro (their choice) — full features, no card charged until the trial ends. After the trial, they either convert or drop back to Free with no penalty and no forced removal of content they already added.
Grandfather existing owners when limits change. If a limit is tightened later (e.g., free photo cap lowered), never retroactively strip content owners already have — apply the new, stricter limit only to what they add going forward.
Pay-per-lead as an alternative to hard-blocking overage. Instead of silently blocking leads beyond the Free cap, let owners unlock an individual over-cap lead for a small one-time fee, as an alternative to subscribing. This also serves as a natural nudge toward the full subscription once someone pays for a few overage leads in one month.
Verified-but-unclaimed trust signal. A business that passes OTP verification but is stuck at verified_pending_upgrade shouldn't look "unclaimed" to visitors. Show a subtle "Owner verified" note on the public listing even pre-upgrade — costs nothing, builds trust, and gives the owner a reason to finish upgrading rather than abandoning the flow.
Transparent billing, no dark patterns. Cancel-anytime with no retention friction, clear proration credit on upgrade/downgrade mid-cycle, and no fake urgency messaging ("Only 2 Featured slots left!") unless literally true.
Loyalty reward for long-term paid owners. Owners on a paid tier for 12+ consecutive months get a modest discount or a free add-on (e.g., a free QR code pack) as a retention thank-you, not just a first-upgrade incentive.
Tasks
 Set up Stripe products: featured_monthly/annual, pro_ad_monthly/annual, enterprise_monthly/annual
 Set up Stripe add-on prices: listing_boost_7day/30day, extra_photo_slot, review_campaign_send, qr_code_pack, ai_description_writer
 Build Stripe Checkout flow from the owner dashboard
 Build Stripe webhook Edge Function → updates subscriptions/addon_purchases, flips plan_tier/is_featured on the business
 Create an entitlements config (per plan_tier, matching the table above) as the single source of truth for limits
 Build one shared entitlement-check function — do not scatter separate if checks per feature — and wire it into:
Add Business / Claim Business: block a 2nd+ business on Free (1 max), 4th+ on Pro (3 max); Enterprise unlimited — same rule for owner-created and claimed listings
On claim specifically: if OTP verification succeeds but the owner is at their limit, set status: verified_pending_upgrade (preserve the OTP proof, no re-verification later) and prompt to upgrade; on successful Stripe checkout, auto-finalize to status: claimed
Photos: cap gallery uploads per the table
Description length: cap characters per the table
Leads: cap visible leads/month on Free (5) — additional leads still recorded but shown blurred/locked with an upgrade CTA, never silently dropped
Categories per listing: enforce per the table
Active deals/coupons: enforce per the table
Feature flags: booking calendar, messaging inbox, video gallery gated to Pro+ only
 Enforce every limit server-side (Edge Function/RLS-level) — never rely on UI-only restrictions
 Build proactive frontend limit indicators (e.g. "2/3 photos used — upgrade for unlimited") instead of an unexplained wall
 Exempt basic data-accuracy edits (contact info, hours, address, category correction, review/Q&A replies) from all tier gating — always free on every plan
 Build a one-time free-trial flow (14–30 days, owner's choice of Featured or Pro) triggered right after claiming; no card charge until trial end; graceful downgrade to Free with no content removal if not converted
 Add a plan_tier_grandfather mechanism — when entitlement limits change in the entitlements config, existing content over the new limit is preserved (read-only if needed) rather than deleted or hidden; new limit applies only to future additions
 Build a pay-per-lead unlock option (small one-time Stripe charge) as an alternative to subscribing, for Free-tier owners who hit the monthly lead cap
 Add an "Owner verified" badge/note on public listings with status: verified_pending_upgrade — signals trust pre-upgrade without granting full claimed status
 Ensure Stripe subscription changes prorate correctly on upgrade/downgrade, and cancellation requires no retention friction (no forced call, no hidden multi-step cancel flow)
 Add a loyalty check (12+ consecutive months on a paid tier) that grants a discount or free add-on credit
 Build owner referral program (referrals table) — invite another business, reward on successful claim/subscription
 Add billing management page (view plan, invoices, cancel/upgrade)
Deliverables

Full paid upgrade flow, working Stripe webhooks, server-side entitlement enforcement across business count/photos/description length/leads/categories/deals/Pro-only features, plus the fairness layer: free trial, grandfathering, pay-per-lead overage option, verified-pre-upgrade trust badge, transparent billing, and loyalty rewards.

Exit Criteria
A test owner can upgrade to Featured via Stripe Checkout and immediately see the Featured badge/placement reflected on their public listing
A Free-tier owner attempting to add or claim a 2nd business is blocked with a clear upgrade prompt
A verified_pending_upgrade claim auto-completes to claimed the moment checkout succeeds, with no re-verification required
Basic data-accuracy edits work on Free tier with zero gating
A new claimed business is offered a one-time free trial, and reverts cleanly to Free (content intact) if not converted
Lowering a limit in the entitlements config does not remove or hide any existing owner's content above the new cap
A Free-tier owner who hits their lead cap can unlock a single additional lead via a one-time payment, without subscribing
A verified_pending_upgrade business shows an "Owner verified" note publicly
Canceling a subscription requires no more than a single confirmation step, with correct proration shown before confirming