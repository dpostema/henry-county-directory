"use server";

import { createClient } from "@/utils/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchCompareBusinesses(ids: string[]) {
  if (!ids || ids.length === 0) return { data: [], error: null };

  // Filter out any non-UUID values to prevent Supabase errors
  const validIds = ids.filter((id) => typeof id === "string" && UUID_REGEX.test(id));

  if (validIds.length === 0) {
    return { data: [], error: "No valid listing IDs provided." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(`
      *,
      category:categories(name),
      city:cities(name)
    `)
    .in("id", validIds);

  if (error) {
    console.error("[Compare] Supabase error:", error.message);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}
