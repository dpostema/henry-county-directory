import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payloadText = await req.text();
    const event = JSON.parse(payloadText);

    const { type, data } = event;
    const session = data.object;

    console.log(`[EDGE WEBHOOK] Processing event type: ${type}`);

    if (type === "checkout.session.completed") {
      const metadata = session.metadata;
      if (metadata) {
        const { businessId, planTier, addonType } = metadata;

        if (planTier) {
          await supabase
            .from("businesses")
            .update({
              plan_tier: planTier,
              is_featured: ["featured", "pro", "enterprise"].includes(planTier),
              updated_at: new Date().toISOString(),
            })
            .eq("id", businessId);

          await supabase.from("subscriptions").insert({
            business_id: businessId,
            stripe_subscription_id: session.subscription || `sub-${Math.random().toString(36).slice(2, 10)}`,
            stripe_customer_id: session.customer || "cust-id",
            status: "active",
            plan_tier: planTier,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        } else if (addonType) {
          await supabase.from("addon_purchases").insert({
            business_id: businessId,
            addon_type: addonType,
            stripe_payment_intent_id: session.payment_intent || `pi-${Math.random().toString(36).slice(2, 10)}`,
            status: "completed",
          });

          if (addonType === "listing_boost_30day") {
            await supabase
              .from("businesses")
              .update({
                is_featured: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", businessId);
          }
        }
      }
    }

    if (type === "customer.subscription.deleted") {
      const subscriptionId = session.id;
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("business_id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (sub) {
        await supabase
          .from("businesses")
          .update({
            plan_tier: "free",
            is_featured: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.business_id);

        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
