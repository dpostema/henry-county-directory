import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "../DashboardClient";

export default async function BusinessDashboardPage() {
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

  if (profile?.role === "visitor") {
    redirect("/dashboard/visitor");
  }

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

  return (
    <DashboardClient
      initialBusinesses={businesses || []}
      categories={categories || []}
      cities={cities || []}
      userProfile={profile}
      // Passing empty arrays to satisfy any prop requirements, though not used by owner
      visitorFavorites={[]}
      visitorReviews={[]}
    />
  );
}
