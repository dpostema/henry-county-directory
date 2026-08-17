import { createClient } from "@/utils/supabase/server";
import HomeClient from "./(public)/_components/HomeClient";
import { searchBusinesses } from "@/services/search";

export const revalidate = 3600; // Cache homepage for 1 hour

export default async function Homepage() {
  const supabase = await createClient();
  
  // Fetch initial un-filtered listings for the home page (e.g. top 20 or popular)
  const initialListings = await searchBusinesses(supabase, {});

  // Fetch dynamic sections
  const { data: dbCategories } = await supabase.from('categories').select('*');
  const { data: dbCities } = await supabase.from('cities').select('*');
  const { data: dbArticles } = await supabase.from('articles')
    .select('id, title, slug, excerpt, created_at, cover_image_url')
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <HomeClient 
      initialListings={initialListings} 
      dbCategories={dbCategories || undefined}
      dbCities={dbCities || undefined}
      dbArticles={dbArticles || undefined}
    />
  );
}
