/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(req: Request) {
  // Use service role client to bypass RLS since webhooks are server-level callbacks
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const payloadText = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(payloadText, sig, webhookSecret);
    } else {
      // Local dev simulation fallback if signature secret is not set
      event = JSON.parse(payloadText);
    }
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK ERROR] ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const { type, data } = event;
  const session = data.object;

  console.log(`[STRIPE WEBHOOK] Received event: ${type}`);

  try {
    if (type === "checkout.session.completed") {
      const metadata = session.metadata;
      if (!metadata) {
        return NextResponse.json({ received: true, message: "No metadata found." });
      }

      const { businessId, planTier, addonType } = metadata;

      if (planTier) {
        // 1. Upgrade listing plan tier and toggle featured status
        await supabase
          .from("businesses")
          .update({
            plan_tier: planTier,
            is_featured: ["featured", "pro", "enterprise"].includes(planTier),
            updated_at: new Date().toISOString(),
          })
          .eq("id", businessId);

        // 2. Insert subscription logs
        const { error: subErr } = await supabase.from("subscriptions").insert({
          business_id: businessId,
          stripe_subscription_id: session.subscription || `sub-${Math.random().toString(36).slice(2, 10)}`,
          stripe_customer_id: session.customer || "cust-id",
          status: "active",
          plan_tier: planTier,
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (subErr) throw subErr;

        // Fetch business details for webhook
        const { data: bus } = await supabase.from("businesses").select("name, email, phone").eq("id", businessId).single();
        if (bus) {
          const { dispatchGhlWebhook } = await import("@/services/ghl");
          await dispatchGhlWebhook({
            email: bus.email,
            name: bus.name,
            phone: bus.phone,
            event: "directory-subscribed",
            source: "Stripe Webhook",
            tags: ["directory-subscribed", `plan-${planTier}`]
          });
        }

        console.log(`[STRIPE WEBHOOK] Business ${businessId} upgraded to ${planTier}.`);
      } else if (addonType) {
        // Insert addon purchase details
        const { error: addErr } = await supabase.from("addon_purchases").insert({
          business_id: businessId,
          addon_type: addonType,
          stripe_payment_intent_id: session.payment_intent || `pi-${Math.random().toString(36).slice(2, 10)}`,
          status: "completed",
        });

        if (addErr) throw addErr;

        // Boost listing featured status if requested
        if (addonType === "listing_boost_30day") {
          await supabase
            .from("businesses")
            .update({
              is_featured: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", businessId);
        }

        console.log(`[STRIPE WEBHOOK] Addon ${addonType} purchased for business ${businessId}.`);
      }
    }

    if (type === "customer.subscription.updated") {
      const subscriptionId = session.id;
      const { getTierForPrice } = await import("@/utils/stripe");
      const priceId = session.items?.data?.[0]?.price?.id;
      const newTier = priceId ? getTierForPrice(priceId) : null;
      const periodEnd = session.current_period_end ? new Date(session.current_period_end * 1000).toISOString() : null;
      const status = session.status;

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("business_id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (sub) {
        const updates: any = {};
        if (newTier) updates.plan_tier = newTier;
        if (periodEnd) updates.current_period_end = periodEnd;
        if (status) updates.status = status;

        if (Object.keys(updates).length > 0) {
          await supabase
            .from("subscriptions")
            .update(updates)
            .eq("stripe_subscription_id", subscriptionId);
        }

        if (newTier) {
          await supabase
            .from("businesses")
            .update({
              plan_tier: newTier,
              is_featured: ["featured", "pro", "enterprise"].includes(newTier),
              updated_at: new Date().toISOString(),
            })
            .eq("id", sub.business_id);
        }

        console.log(`[STRIPE WEBHOOK] Subscription updated for business ${sub.business_id}.`);
      }
    }

    if (type === "customer.subscription.deleted") {
      const subscriptionId = session.id;

      // 1. Query matching subscription record
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("business_id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (sub) {
        // 2. Demote listing back to free tier
        await supabase
          .from("businesses")
          .update({
            plan_tier: "free",
            is_featured: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.business_id);

        // 3. Mark subscription cancelled
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscriptionId);

        // Fetch business details for webhook
        const { data: bus } = await supabase.from("businesses").select("name, email, phone").eq("id", sub.business_id).single();
        if (bus) {
          const { dispatchGhlWebhook } = await import("@/services/ghl");
          await dispatchGhlWebhook({
            email: bus.email,
            name: bus.name,
            phone: bus.phone,
            event: "directory-unsubscribed",
            source: "Stripe Webhook",
            tags: ["directory-unsubscribed"]
          });
        }

        console.log(`[STRIPE WEBHOOK] Subscription cancelled for business ${sub.business_id}.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK ERROR DBERR] ${err.message}`);
    return NextResponse.json({ error: `Database Sync Error: ${err.message}` }, { status: 500 });
  }
}
