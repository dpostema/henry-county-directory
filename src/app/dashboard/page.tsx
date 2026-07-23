import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. Fetch public profile details
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch all businesses owned by this user
  const { data: businesses } = await supabase
    .from("businesses")
    .select(`
      *,
      category:categories(name, slug),
      city:cities(name, slug)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // 3. Fetch categories and cities for dropdown selection
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  const { data: cities } = await supabase
    .from("cities")
    .select("*")
    .order("name", { ascending: true });

  // 4. Fetch visitor's favorites
  const { data: favorites } = await supabase
    .from("favorites")
    .select(`
      id,
      business_id,
      created_at,
      businesses (
        id,
        name,
        slug,
        cover_image_url,
        category:categories(name),
        city:cities(name)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 5. Fetch visitor's reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      content,
      created_at,
      businesses (
        id,
        name,
        slug,
        cover_image_url
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardClient
      initialBusinesses={businesses || []}
      categories={categories || []}
      cities={cities || []}
      userProfile={profile}
      visitorFavorites={favorites || []}
      visitorReviews={reviews || []}
    />
  );
}
