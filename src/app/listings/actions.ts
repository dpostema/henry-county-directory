"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function toggleFavoriteAction(businessId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to favorite listings." };

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("visitor_id", user.id)
    .eq("business_id", businessId)
    .single();

  if (existing) {
    // Delete favorite
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    if (error) return { error: error.message };
    revalidatePath(`/listings/${businessId}`);
    return { success: "Removed from favorites", isFavorite: false };
  } else {
    // Add favorite
    const { error } = await supabase.from("favorites").insert({
      visitor_id: user.id,
      business_id: businessId,
    });

    if (error) return { error: error.message };
    revalidatePath(`/listings/${businessId}`);
    return { success: "Added to favorites", isFavorite: true };
  }
}

export async function checkFavoriteStatus(businessId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isFavorite: false };

  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("visitor_id", user.id)
    .eq("business_id", businessId)
    .single();

  return { isFavorite: !!data };
}

export async function optInDigestAction(email: string, categories: string[]) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Log subscription to analytics events
  const { error } = await supabase.from("analytics_events").insert({
    event_type: "digest_opt_in",
    visitor_id: user?.id || null,
    metadata: {
      email,
      categories,
      opt_in_time: new Date().toISOString(),
    },
  });

  if (error) return { error: error.message };
  return { success: "You have successfully subscribed to our weekly Henry County digest!" };
}

export async function createCuratedListAction(
  title: string,
  description: string,
  businessIds: string[]
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required to create curated lists." };

  const slug = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-") + "-" + Math.random().toString(36).slice(2, 6);

  // 1. Insert curated list
  const { data: list, error: listError } = await supabase
    .from("best_of_lists")
    .insert({
      title,
      slug,
      description: description || null,
      list_owner_type: "user",
      author_id: user.id,
    })
    .select("id")
    .single();

  if (listError || !list) {
    return { error: listError?.message || "Failed to create list." };
  }

  // 2. Insert items
  const items = businessIds.map((busId, idx) => ({
    list_id: list.id,
    business_id: busId,
    rank: idx + 1,
  }));

  const { error: itemsError } = await supabase.from("best_of_list_items").insert(items);

  if (itemsError) {
    return { error: itemsError.message };
  }

  revalidatePath("/lists");
  return { success: "Curated list created successfully!", slug };
}

export async function createBookingAction(businessId: string, bookingTime: string, details: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to book an appointment." };
  }

  if (!businessId || !bookingTime) {
    return { error: "Business and appointment time are required." };
  }

  const { error } = await supabase.from("bookings").insert({
    business_id: businessId,
    visitor_id: user.id,
    booking_time: bookingTime,
    details: details || null,
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Appointment requested successfully! The business owner has been notified." };
}
