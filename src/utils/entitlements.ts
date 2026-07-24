/* eslint-disable @typescript-eslint/no-explicit-any */
export type PlanTier = "free" | "featured" | "pro" | "enterprise";

export interface TierEntitlements {
  max_businesses: number;
  max_photos: number;
  max_description_chars: number;
  max_leads_per_month: number;
  max_categories: number;
  max_active_deals: number;
  has_booking_calendar: boolean;
  has_messaging_inbox: boolean;
  has_video: boolean;
}

export const ENTITLEMENTS_CONFIG: Record<PlanTier, TierEntitlements> = {
  free: {
    max_businesses: 1,
    max_photos: 3,
    max_description_chars: 300,
    max_leads_per_month: 5,
    max_categories: 1,
    max_active_deals: 0,
    has_booking_calendar: false,
    has_messaging_inbox: false,
    has_video: false,
  },
  featured: {
    max_businesses: 1,
    max_photos: 15,
    max_description_chars: 1000,
    max_leads_per_month: 999999, // unlimited
    max_categories: 1,
    max_active_deals: 1,
    has_booking_calendar: false,
    has_messaging_inbox: false,
    has_video: false,
  },
  pro: {
    max_businesses: 3,
    max_photos: 999999,
    max_description_chars: 999999,
    max_leads_per_month: 999999,
    max_categories: 3,
    max_active_deals: 3,
    has_booking_calendar: true,
    has_messaging_inbox: true,
    has_video: true,
  },
  enterprise: {
    max_businesses: 999999,
    max_photos: 999999,
    max_description_chars: 999999,
    max_leads_per_month: 999999,
    max_categories: 999999,
    max_active_deals: 999999,
    has_booking_calendar: true,
    has_messaging_inbox: true,
    has_video: true,
  },
};

/**
 * Validates if the owner can add/claim another business based on their current plan limits.
 * An owner's effective limit is the max_businesses of the HIGHEST tier among any of their businesses.
 * E.g., if they own a Pro business, they can have up to 3 businesses total.
 */
export async function getOwnerBusinessLimit(ownerId: string, supabase: any): Promise<{
  currentCount: number;
  maxAllowed: number;
  canAdd: boolean;
}> {
  // 1. Get all businesses owned by this user
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("plan_tier")
    .eq("owner_id", ownerId);

  if (error || !businesses) {
    return { currentCount: 0, maxAllowed: 1, canAdd: true };
  }

  const currentCount = businesses.length;

  // 2. Determine highest tier they have across any business
  let highestTier: PlanTier = "free";
  const tierRanks: Record<PlanTier, number> = {
    free: 0,
    featured: 1,
    pro: 2,
    enterprise: 3,
  };

  for (const b of businesses) {
    // Treat null/invalid tier as free
    const tier = (b.plan_tier as PlanTier) || "free";
    if (tierRanks[tier] > tierRanks[highestTier]) {
      highestTier = tier;
    }
  }

  // 3. Get the limit for their highest tier
  const maxAllowed = ENTITLEMENTS_CONFIG[highestTier].max_businesses;
  
  return {
    currentCount,
    maxAllowed,
    canAdd: currentCount < maxAllowed,
  };
}

export function getEntitlements(tier: PlanTier | null | undefined): TierEntitlements {
  return ENTITLEMENTS_CONFIG[tier || "free"];
}

export function hasFeatureAccess(tier: PlanTier | null | undefined, feature: keyof TierEntitlements): boolean {
  if (!tier) tier = "free";
  
  const val = ENTITLEMENTS_CONFIG[tier][feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  
  return false;
}
