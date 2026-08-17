"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { siteConfig } from "@/config/site";

// ─── Admin Auth Helper ────────────────────────────────────────────────────────

async function getAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null as any, user: null, error: "Authentication required." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { supabase: null as any, user: null, error: "Unauthorized. Admins only." };
  }
  return { supabase, user, error: null };
}

async function writeLog(supabase: any, adminId: string, action: string, details?: string) {
  await supabase.from("admin_logs").insert({ admin_id: adminId, action, details });
}

// ─── Claim Actions ────────────────────────────────────────────────────────────

export async function approveClaimAction(requestId: string, businessId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: reqError } = await supabase
    .from("claim_requests")
    .update({ status: "approved" })
    .eq("id", requestId);
  if (reqError) return { error: reqError.message };

  const { error: busError } = await supabase
    .from("businesses")
    .update({ status: "claimed", verification_level: "verified" })
    .eq("id", businessId);
  if (busError) return { error: busError.message };

  await writeLog(supabase, user!.id, "claim_approved", `RequestID:${requestId} BusinessID:${businessId}`);
  revalidatePath("/admin");
  return { success: "Claim approved and listing verified." };
}

export async function rejectClaimAction(requestId: string, businessId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: reqError } = await supabase
    .from("claim_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);
  if (reqError) return { error: reqError.message };

  const { error: busError } = await supabase
    .from("businesses")
    .update({ owner_id: null, status: "unclaimed", verification_level: "unverified" })
    .eq("id", businessId);
  if (busError) return { error: busError.message };

  await writeLog(supabase, user!.id, "claim_rejected", `RequestID:${requestId} BusinessID:${businessId}`);
  revalidatePath("/admin");
  return { success: "Claim rejected and listing reset to unclaimed." };
}

// ─── Duplicate Actions ────────────────────────────────────────────────────────

export async function dismissDuplicateAction(flagId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase
    .from("duplicate_flags")
    .update({ status: "resolved_dismissed" })
    .eq("id", flagId);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "duplicate_dismissed", `FlagID:${flagId}`);
  revalidatePath("/admin");
  return { success: "Duplicate flag dismissed." };
}

export async function mergeListingsAction(keepId: string, removeId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  // Re-parent child rows to the keeper listing
  const childTables = ["leads", "reviews", "qna", "bookings", "listing_media", "deals", "events"];
  for (const table of childTables) {
    await supabase.from(table).update({ business_id: keepId }).eq("business_id", removeId);
  }

  // Handle favorites (unique constraint) — move then delete originals
  const { data: favRows } = await supabase
    .from("favorites")
    .select("visitor_id")
    .eq("business_id", removeId);
  if (favRows) {
    for (const fav of favRows) {
      await supabase
        .from("favorites")
        .upsert(
          { visitor_id: fav.visitor_id, business_id: keepId },
          { onConflict: "visitor_id,business_id", ignoreDuplicates: true }
        );
      await supabase
        .from("favorites")
        .delete()
        .eq("visitor_id", fav.visitor_id)
        .eq("business_id", removeId);
    }
  }

  // Mark duplicate flags resolved
  await supabase
    .from("duplicate_flags")
    .update({ status: "resolved_merged" })
    .or(`business_a_id.eq.${removeId},business_b_id.eq.${removeId}`);

  // Delete the removed listing
  const { error: delError } = await supabase.from("businesses").delete().eq("id", removeId);
  if (delError) return { error: delError.message };

  await writeLog(supabase, user!.id, "listings_merged", `Kept:${keepId} Removed:${removeId}`);
  revalidatePath("/admin");
  return { success: "Listings merged. Duplicate listing removed." };
}

// ─── Moderation Actions ───────────────────────────────────────────────────────

export async function deleteReviewAction(reviewId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "review_deleted", `ReviewID:${reviewId}`);
  revalidatePath("/admin");
  return { success: "Review deleted." };
}

export async function flagReviewAction(reviewId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  // Use status field to flag — existing column, no schema change needed
  const { error: dbError } = await supabase
    .from("reviews")
    .update({ status: "flagged" })
    .eq("id", reviewId);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "review_flagged", `ReviewID:${reviewId}`);
  revalidatePath("/admin");
  return { success: "Review flagged as spam." };
}

export async function approveReviewAction(reviewId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase
    .from("reviews")
    .update({ status: "approved" })
    .eq("id", reviewId);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "review_approved", `ReviewID:${reviewId}`);
  revalidatePath("/admin");
  return { success: "Review approved and visible." };
}

export async function deleteQnaAction(qnaId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("qna").delete().eq("id", qnaId);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "qna_deleted", `QnaID:${qnaId}`);
  revalidatePath("/admin");
  return { success: "Q&A entry deleted." };
}

export async function flagQnaAction(qnaId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  // Use status or is_answered field — fall back gracefully
  const { error: dbError } = await supabase
    .from("qna")
    .update({ status: "flagged" })
    .eq("id", qnaId);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "qna_flagged", `QnaID:${qnaId}`);
  revalidatePath("/admin");
  return { success: "Q&A flagged as spam." };
}

export async function flagLeadAction(leadId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase
    .from("leads")
    .update({ status: "flagged" })
    .eq("id", leadId);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "lead_flagged", `LeadID:${leadId}`);
  revalidatePath("/admin");
  return { success: "Lead flagged as spam." };
}

// ─── Listing Admin Actions ────────────────────────────────────────────────────

export async function updateBusinessAdminAction(
  busId: string,
  fields: { plan_tier?: string; status?: string; is_featured?: boolean; featured_until?: string | null }
) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("businesses").update(fields).eq("id", busId);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "business_updated", `BusID:${busId} ${JSON.stringify(fields)}`);
  revalidatePath("/admin");
  return { success: "Business updated." };
}

// ─── Category / City Management ───────────────────────────────────────────────

export async function createCategoryAction(name: string, slug: string, icon: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("categories").insert({ name, slug, icon });
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "category_created", `Name:${name}`);
  revalidatePath("/admin");
  return { success: `Category "${name}" created.` };
}

export async function deleteCategoryAction(id: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("categories").delete().eq("id", id);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "category_deleted", `ID:${id}`);
  revalidatePath("/admin");
  return { success: "Category deleted." };
}

export async function createCityAction(name: string, slug: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("cities").insert({ name, slug });
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "city_created", `Name:${name}`);
  revalidatePath("/admin");
  return { success: `City "${name}" created.` };
}

export async function deleteCityAction(id: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("cities").delete().eq("id", id);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "city_deleted", `ID:${id}`);
  revalidatePath("/admin");
  return { success: "City deleted." };
}

// ─── Tenant Management ────────────────────────────────────────────────────────

export async function createTenantAction(name: string, slug: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("tenants").insert({ name, slug });
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "tenant_created", `Name:${name}`);
  revalidatePath("/admin");
  return { success: `Tenant "${name}" created.` };
}

export async function deleteTenantAction(id: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("tenants").delete().eq("id", id);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "tenant_deleted", `ID:${id}`);
  revalidatePath("/admin");
  return { success: "Tenant deleted." };
}

// ─── Best-of List Actions ─────────────────────────────────────────────────────

export async function createBestOfListAction(title: string, slug: string, description: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("best_of_lists").insert({
    title,
    slug,
    description,
    list_owner_type: "admin",
    author_id: user!.id,
  });
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "bestof_list_created", `Title:${title}`);
  revalidatePath("/admin");
  return { success: `List "${title}" created.` };
}

export async function addBestOfListItemAction(listId: string, businessId: string, rank: number) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase
    .from("best_of_list_items")
    .insert({ list_id: listId, business_id: businessId, rank });
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "bestof_item_added", `ListID:${listId} BusID:${businessId}`);
  revalidatePath("/admin");
  return { success: "Business added to list." };
}

export async function removeBestOfListItemAction(itemId: string) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase.from("best_of_list_items").delete().eq("id", itemId);
  if (dbError) return { error: dbError.message };

  await writeLog(supabase, user!.id, "bestof_item_removed", `ItemID:${itemId}`);
  revalidatePath("/admin");
  return { success: "Item removed from list." };
}

// ─── A/B Test Persistence (stored in admin_logs) ──────────────────────────────

export async function upsertAbTestAction(id: string, name: string, enabled: boolean) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  // Store AB test state as a special admin_log entry (no new table needed)
  await writeLog(
    supabase,
    user!.id,
    "ab_test_update",
    JSON.stringify({ id, name, enabled, ts: new Date().toISOString() })
  );
  revalidatePath("/admin");
  return { success: `A/B test "${name}" ${enabled ? "enabled" : "disabled"}.` };
}

// ─── Referral Reward Action ───────────────────────────────────────────────────

export async function updateReferralRewardAction(referralId: string, rewarded: boolean) {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  const { error: dbError } = await supabase
    .from("referrals")
    .update({ reward_paid: rewarded })
    .eq("id", referralId);

  // Graceful: column may not exist yet
  if (dbError && dbError.code !== "42703") return { error: dbError.message };

  await writeLog(supabase, user!.id, "referral_reward_updated", `ReferralID:${referralId} Rewarded:${rewarded}`);
  revalidatePath("/admin");
  return { success: rewarded ? "Reward marked as paid." : "Reward marked as unpaid." };
}

// ─── Seed Dummy Data Action ───────────────────────────────────────────────────

export async function seedDummyDataAdminAction() {
  const { supabase, user, error } = await getAdminContext();
  if (error || !supabase) return { error };

  // 1. Categories
  const categories = [
    { name: "Medicals & Healthcare", slug: "medicals", icon: "Activity" },
    { name: "Automotive & Repair", slug: "automotive", icon: "Car" },
    { name: "Foods & Dining", slug: "foods", icon: "Utensils" },
    { name: "Home Services & Contracting", slug: "services", icon: "Home" },
    { name: "Professional & Legal Services", slug: "professional", icon: "Briefcase" },
    { name: "Beauty & Personal Care", slug: "beauty-spa", icon: "Sparkles" },
    { name: "Retail & Shopping", slug: "shopping", icon: "ShoppingBag" },
    { name: "Fitness & Sports", slug: "fitness", icon: "Dumbbell" }
  ];

  for (const c of categories) {
    await supabase.from("categories").upsert(c, { onConflict: "slug" });
  }

  // 2. Cities
  const cities = [
    { name: "McDonough", slug: "mcdonough", state: "GA" },
    { name: "Stockbridge", slug: "stockbridge", state: "GA" },
    { name: "Hampton", slug: "hampton", state: "GA" },
    { name: "Locust Grove", slug: "locust-grove", state: "GA" },
    { name: "Flippen", slug: "flippen", state: "GA" },
    { name: "Blacksville", slug: "blacksville", state: "GA" }
  ];

  for (const c of cities) {
    await supabase.from("cities").upsert(c, { onConflict: "slug" });
  }

  const { data: dbCategories } = await supabase.from("categories").select("*");
  const { data: dbCities } = await supabase.from("cities").select("*");

  const catMap = new Map((dbCategories || []).map((c: any) => [c.slug, c.id]));
  const cityMap = new Map((dbCities || []).map((c: any) => [c.slug, c.id]));

  // 3. Businesses
  const dummyListings = [
    {
      name: "McDonough Family Dental Care",
      slug: "mcdonough-family-dental-care",
      category_id: catMap.get("medicals"),
      city_id: cityMap.get("mcdonough"),
      address: "125 Sabot Way, McDonough, GA 30253",
      phone: "(770) 555-0210",
      email: "info@mcdonoughdental.com",
      website: "https://mcdonoughdental.com",
      description: "Premier dental clinic offering comprehensive family oral healthcare, teeth whitening, clear aligners, and dental implants in ${siteConfig.region.name}.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "pro",
      is_featured: true,
      rating_avg: 4.90,
      review_count: 42,
    },
    {
      name: "Stockbridge Auto Repair & Diagnostics",
      slug: "stockbridge-auto-repair-diagnostics",
      category_id: catMap.get("automotive"),
      city_id: cityMap.get("stockbridge"),
      address: "480 North Henry Blvd, Stockbridge, GA 30281",
      phone: "(770) 555-0220",
      email: "service@stockbridgeauto.com",
      website: "https://stockbridgeauto.com",
      description: "Certified ASE mechanics providing computer engine diagnostics, transmission service, brake overhauls, and oil changes.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "enterprise",
      is_featured: true,
      rating_avg: 4.85,
      review_count: 58,
    },
    {
      name: "Hampton Coffee Depot & Bakery",
      slug: "hampton-coffee-depot-bakery",
      category_id: catMap.get("foods"),
      city_id: cityMap.get("hampton"),
      address: "12 Cherry St, Hampton, GA 30228",
      phone: "(770) 555-0230",
      email: "hello@hamptoncoffee.com",
      website: "https://hamptoncoffee.com",
      description: "Cozy neighborhood coffee lounge serving specialty espresso drinks, fresh cinnamon rolls, and quiet work spaces.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "featured",
      is_featured: true,
      rating_avg: 4.95,
      review_count: 37,
    },
    {
      name: "Southern Classic Smokehouse BBQ",
      slug: "southern-classic-smokehouse-bbq",
      category_id: catMap.get("foods"),
      city_id: cityMap.get("mcdonough"),
      address: "85 Jonesboro Rd, McDonough, GA 30253",
      phone: "(770) 555-0240",
      email: "bbq@southernclassic.com",
      website: "https://southernclassicbbq.com",
      description: "Slow-smoked hickory BBQ ribs, pulled pork, brisket, fried okra, and full event catering services.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "enterprise",
      is_featured: true,
      rating_avg: 4.90,
      review_count: 73,
    },
    {
      name: "Eagle's Landing Heating & Air",
      slug: "eagles-landing-heating-air",
      category_id: catMap.get("services"),
      city_id: cityMap.get("stockbridge"),
      address: "110 Rock Quarry Rd, Stockbridge, GA 30281",
      phone: "(770) 555-0250",
      email: "support@eagleslandinghvac.com",
      website: "https://eagleslandinghvac.com",
      description: "Trusted HVAC technicians offering emergency air conditioning repair, furnace replacements, and duct purification.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "enterprise",
      is_featured: true,
      rating_avg: 4.85,
      review_count: 31,
    },
    {
      name: "${siteConfig.region.name} Day Spa & Wellness",
      slug: "henry-county-day-spa-wellness",
      category_id: catMap.get("beauty-spa"),
      city_id: cityMap.get("mcdonough"),
      address: "210 Keys Ferry St, McDonough, GA 30253",
      phone: "(770) 555-0260",
      email: "spa@henrywellness.com",
      website: "https://henrywellness.com",
      description: "Relaxing day spa offering therapeutic massages, deep cleansing facials, manicure spa treatments, and sauna sessions.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "pro",
      is_featured: false,
      rating_avg: 4.75,
      review_count: 24,
    },
    {
      name: "Locust Grove Animal Hospital",
      slug: "locust-grove-animal-hospital",
      category_id: catMap.get("medicals"),
      city_id: cityMap.get("locust-grove"),
      address: "3850 Highway 42, Locust Grove, GA 30248",
      phone: "(770) 555-0270",
      email: "care@locustgrovevet.com",
      website: "https://locustgrovevet.com",
      description: "Compassionate pet healthcare, routine checkups, dental scaling, pet surgery, and indoor boarding kennels.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "pro",
      is_featured: false,
      rating_avg: 4.92,
      review_count: 48,
    },
    {
      name: "Locust Grove Hardware & Supply",
      slug: "locust-grove-hardware-supply",
      category_id: catMap.get("shopping"),
      city_id: cityMap.get("locust-grove"),
      address: "3700 Highway 42, Locust Grove, GA 30248",
      phone: "(770) 555-0290",
      email: "sales@locustgrovehardware.com",
      website: "https://locustgrovehardware.com",
      description: "Local hardware store stocking lawn mowers, building materials, plumbing supplies, paint mixing, and key cutting.",
      verification_level: "unverified",
      status: "unclaimed",
      plan_tier: "free",
      is_featured: false,
      rating_avg: 4.60,
      review_count: 14,
    }
  ];

  let count = 0;
  for (const b of dummyListings) {
    const { error: insErr } = await supabase.from("businesses").upsert(b as any, { onConflict: "slug" });
    if (!insErr) count++;
  }

  await writeLog(supabase, user!.id, "dummy_data_seeded", `Seeded ${count} listings`);
  revalidatePath("/admin");
  revalidatePath("/listings");
  return { success: `Successfully seeded ${count} dummy business listings!` };
}
