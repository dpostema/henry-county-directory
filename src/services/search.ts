/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";

export interface SearchParams {
  query?: string;
  categorySlug?: string;
  citySlug?: string;
  filterType?: "all" | "featured" | "best_rate" | "most_view" | "popular" | "ad";
  latitude?: number;
  longitude?: number;
  openNow?: boolean;
}

export async function searchBusinesses(supabase: SupabaseClient, params: SearchParams) {
  const query = supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      owner_id,
      category_id,
      city_id,
      description,
      address,
      phone,
      email,
      website,
      hours_json,
      verification_level,
      status,
      plan_tier,
      is_featured,
      rating_avg,
      review_count,
      latitude,
      longitude,
      category:categories(name, slug, icon),
      city:cities(name, slug, state),
      media:listing_media(url),
      owner:profiles(avatar_url)
    `)
    .neq("status", "suspended");

  const { data, error } = await query;

  if (error) {
    console.error("Error searching businesses:", error.message);
    return [];
  }

  let results = (data || []) as any[];

  // Filter by category in JS
  if (params.categorySlug) {
    results = results.filter((item) => item.category?.slug === params.categorySlug);
  }

  // Filter by city in JS
  if (params.citySlug) {
    results = results.filter((item) => item.city?.slug === params.citySlug);
  }

  // Handle textual query in JS
  if (params.query) {
    const q = params.query.toLowerCase();
    results = results.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.address?.toLowerCase().includes(q)
    );
  }

  // Filter Type
  if (params.filterType === "featured") {
    results = results.filter((item) => item.is_featured);
  } else if (params.filterType === "ad") {
    results = results.filter((item) => item.plan_tier === "enterprise");
  }

  // Filter for real-time open status
  if (params.openNow) {
    results = results.filter((item) => isBusinessOpenNow(item.hours_json));
  }

  // Filter sorting
  if (params.filterType === "best_rate") {
    results.sort((a, b) => b.rating_avg - a.rating_avg);
  } else if (params.filterType === "most_view") {
    results.sort((a, b) => b.review_count - a.review_count);
  } else if (params.filterType === "popular") {
    results.sort((a, b) => b.rating_avg * b.review_count - a.rating_avg * a.review_count);
  }

  // Geolocation-based distance sorting
  if (params.latitude !== undefined && params.longitude !== undefined) {
    const userLat = params.latitude;
    const userLon = params.longitude;

    results = results.map((item) => {
      const distance =
        item.latitude !== null && item.longitude !== null
          ? getDistance(userLat, userLon, Number(item.latitude), Number(item.longitude))
          : Infinity;
      return { ...item, distance };
    });

    results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }

  return results;
}

// Spherical Distance (Haversine formula in Kilometers)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's Radius
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Operational status validation
export function isBusinessOpenNow(hoursJson: any): boolean {
  if (!hoursJson || typeof hoursJson !== "object") return false;
  try {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();
    // The region operates on a specific Time Zone
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: siteConfig.region.timeZone }));
    const currentDay = days[localTime.getDay()];
    const hours = hoursJson[currentDay];

    if (!hours || hours.closed || !hours.open || !hours.close) {
      return false;
    }

    const [openH, openM] = hours.open.split(":").map(Number);
    const [closeH, closeM] = hours.close.split(":").map(Number);

    const openTime = new Date(localTime);
    openTime.setHours(openH, openM, 0, 0);

    const closeTime = new Date(localTime);
    closeTime.setHours(closeH, closeM, 0, 0);

    // Handle overnight operation (e.g. 22:00 to 02:00)
    if (closeTime < openTime) {
      closeTime.setDate(closeTime.getDate() + 1);
    }

    return localTime >= openTime && localTime <= closeTime;
  } catch (err) {
    console.error("Failed to parse operational status:", err);
    return false;
  }
}
