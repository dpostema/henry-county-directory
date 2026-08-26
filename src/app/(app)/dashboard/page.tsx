import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardRedirectorPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch public profile details to get role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "visitor") {
    redirect("/dashboard/visitor");
  } else {
    redirect("/dashboard/business");
  }
}
