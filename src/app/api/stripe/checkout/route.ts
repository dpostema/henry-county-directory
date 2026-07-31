/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Get current logged in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { businessId, planTier, addonType } = await req.json();

    if (!businessId || (!planTier && !addonType)) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const { STRIPE_PRICES } = await import("@/utils/stripe");

    let priceId = "";
    let isSubscription = false;

    if (planTier) {
      isSubscription = true;
      if (planTier === "featured") priceId = STRIPE_PRICES.featured_monthly;
      if (planTier === "pro") priceId = STRIPE_PRICES.pro_monthly;
      if (planTier === "enterprise") priceId = STRIPE_PRICES.enterprise_monthly;
    } else if (addonType) {
      if (addonType === "listing_boost_30day") priceId = STRIPE_PRICES.listing_boost_30day;
      if (addonType === "extra_photo_slot") priceId = STRIPE_PRICES.extra_photo_slot;
      if (addonType === "lead_unlock") priceId = STRIPE_PRICES.lead_unlock;
      if (addonType === "ai_description_writer") priceId = STRIPE_PRICES.ai_description_writer;
      if (addonType === "review_campaign_send") priceId = STRIPE_PRICES.review_campaign_send;
      if (addonType === "qr_code_pack") priceId = STRIPE_PRICES.qr_code_pack;
    }

    if (!priceId) {
       return NextResponse.json({ error: "Invalid plan or addon" }, { status: 400 });
    }

    // Check if user actually owns this business
    const { data: business, error: busError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .single();

    if (busError || !business) {
      return NextResponse.json({ error: "Business not found or access denied" }, { status: 404 });
    }

    // We can also fetch the user's stripe_customer_id if it exists in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const customerId = profile?.stripe_customer_id;

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const sessionConfig: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${origin}/dashboard?checkout_success=true&business_id=${businessId}`,
      cancel_url: `${origin}/dashboard?checkout_cancel=true`,
      metadata: {
        userId: user.id,
        businessId: business.id,
        planTier: planTier || undefined,
        addonType: addonType || undefined,
      },
    };

    if (customerId) {
      sessionConfig.customer = customerId;
    } else {
      sessionConfig.customer_email = user.email;
    }

    // For subscriptions, we can also set subscription_data.metadata
    if (isSubscription) {
      sessionConfig.subscription_data = {
        metadata: {
          userId: user.id,
          businessId: business.id,
          planTier: planTier || undefined,
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
