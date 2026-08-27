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

  const finalBusinesses = businesses || [];

  // Auto-create business if none exists but metadata has business_name
  if (finalBusinesses.length === 0 && user.user_metadata?.business_name) {
    let categoryId = null;
    if (user.user_metadata.business_category) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("name", user.user_metadata.business_category)
        .single();
      categoryId = catData?.id || null;
    }

    const { data: newBusiness, error: insertError } = await supabase.from("businesses").insert({
      owner_id: user.id,
      name: user.user_metadata.business_name,
      slug: user.user_metadata.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + String(Date.now()).slice(-4),
      phone: user.user_metadata.business_phone || null,
      category_id: categoryId,
      status: "claimed",
      verification_level: "unverified"
    }).select(`*, category:categories(name, slug), city:cities(name, slug)`).single();

    if (insertError) {
      console.error("Auto-onboarding business creation failed:", insertError);
      // Clear metadata anyway to prevent endless retry loops on failure
      await supabase.auth.updateUser({
        data: { business_name: null }
      });
    }

    if (newBusiness) {
      // Once created, we should remove it from metadata so it doesn't trigger repeatedly
      await supabase.auth.updateUser({
        data: { business_name: null }
      });
      redirect("/dashboard/business?tab=edit");
    }
  }

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
      initialBusinesses={finalBusinesses}
      categories={categories || []}
      cities={cities || []}
      userProfile={profile}
      // Passing empty arrays to satisfy any prop requirements, though not used by owner
      visitorFavorites={[]}
      visitorReviews={[]}
    />
  );
}
