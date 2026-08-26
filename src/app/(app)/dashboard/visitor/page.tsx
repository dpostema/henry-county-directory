import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VisitorDashboard from "../VisitorDashboard";

export default async function VisitorDashboardPage() {
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

  if (profile?.role === "owner") {
    redirect("/dashboard/business");
  }

  // 2. Fetch visitor's favorites
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

  // 3. Fetch visitor's reviews
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
    <VisitorDashboard
      userProfile={profile}
      favorites={favorites || []}
      reviews={reviews || []}
    />
  );
}
