import { createClient } from "@/utils/supabase/server";
import DirectoryClient from "./DirectoryClient";
import { searchBusinesses } from "@/services/search";

export const revalidate = 3600; // Cache directory page for 1 hour

export default async function DirectoryPage() {
  const supabase = await createClient();
  
  // Fetch initial un-filtered listings for the directory page
  const initialListings = await searchBusinesses(supabase, {});

  return <DirectoryClient initialListings={initialListings} />;
}
