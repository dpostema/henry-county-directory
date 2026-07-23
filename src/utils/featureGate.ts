import { hasFeatureAccess as baseHasAccess } from "./entitlements";
import type { PlanTier, TierEntitlements } from "./entitlements";

export type FeatureKey = keyof TierEntitlements | "featured_placement" | "pro_ad_slot" | "extra_photos" | "ai_tools" | "competitor_benchmarks";

export function hasFeatureAccess(planTier: string | null | undefined, feature: FeatureKey): boolean {
  const tier = (planTier || "free").toLowerCase() as PlanTier;

  // Legacy feature flags mapped to new logic
  switch (feature) {
    case "featured_placement":
      return ["featured", "pro", "enterprise"].includes(tier);
    case "pro_ad_slot":
    case "ai_tools":
    case "competitor_benchmarks":
      return ["pro", "enterprise"].includes(tier);
    case "extra_photos":
      return ["featured", "pro", "enterprise"].includes(tier); // Handled by limits now
  }

  // Fallback to entitlements config
  return baseHasAccess(tier, feature as keyof TierEntitlements);
}
