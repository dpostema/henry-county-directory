/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing STRIPE_SECRET_KEY environment variable. Stripe features will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20" as any, // specify the API version installed or skip
  typescript: true,
});

// These IDs should ideally be in environment variables or synced from DB,
// but hardcoding them here for this implementation based on the user's setup.
export const STRIPE_PRICES = {
  featured_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_FEATURED_MONTHLY || "price_featured_monthly",
  featured_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_FEATURED_ANNUAL || "price_featured_annual",
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
  pro_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || "price_pro_annual",
  enterprise_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || "price_enterprise_monthly",
  enterprise_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL || "price_enterprise_annual",
  
  // Addons
  listing_boost_7day: process.env.NEXT_PUBLIC_STRIPE_PRICE_BOOST_7DAY || "price_boost_7day",
  listing_boost_30day: process.env.NEXT_PUBLIC_STRIPE_PRICE_BOOST_30DAY || "price_boost_30day",
  extra_photo_slot: process.env.NEXT_PUBLIC_STRIPE_PRICE_EXTRA_PHOTO || "price_extra_photo",
  review_campaign_send: process.env.NEXT_PUBLIC_STRIPE_PRICE_REVIEW_CAMPAIGN || "price_review_campaign",
  qr_code_pack: process.env.NEXT_PUBLIC_STRIPE_PRICE_QR_CODE || "price_qr_code",
  ai_description_writer: process.env.NEXT_PUBLIC_STRIPE_PRICE_AI_DESC || "price_ai_desc",
  lead_unlock: process.env.NEXT_PUBLIC_STRIPE_PRICE_LEAD_UNLOCK || "price_lead_unlock",
};

/**
 * Helper to get the PlanTier associated with a price ID
 */
export function getTierForPrice(priceId: string): "featured" | "pro" | "enterprise" | null {
  if (priceId === STRIPE_PRICES.featured_monthly || priceId === STRIPE_PRICES.featured_annual) {
    return "featured";
  }
  if (priceId === STRIPE_PRICES.pro_monthly || priceId === STRIPE_PRICES.pro_annual) {
    return "pro";
  }
  if (priceId === STRIPE_PRICES.enterprise_monthly || priceId === STRIPE_PRICES.enterprise_annual) {
    return "enterprise";
  }
  return null;
}
