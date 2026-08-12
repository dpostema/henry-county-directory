import { createClient } from "@/utils/supabase/server";
import HomeClient from "./(public)/_components/HomeClient";
import { searchBusinesses } from "@/services/search";

export const revalidate = 3600; // Cache homepage for 1 hour

export default async function Homepage() {
  const supabase = await createClient();
  
  // Fetch initial un-filtered listings for the home page (e.g. top 20 or popular)
  const initialListings = await searchBusinesses(supabase, {});

  return <HomeClient initialListings={initialListings} />;
}
