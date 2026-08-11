import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddListingForm from "./AddListingForm";
import { siteConfig } from "@/config/site";
export default async function AddListingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/add-listing");
  }

  // Fetch categories and cities for dropdown selection
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  const { data: cities } = await supabase
    .from("cities")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="min-h-screen bg-brandBg-app flex flex-col font-body">
      <Header sticky={false} />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-brandBorder-light p-8">
          <div className="mb-8 border-b border-brandBorder-light pb-4">
            <h1 className="text-2xl font-black text-brandText-dark font-heading">Add a New Listing</h1>
            <p className="text-sm text-brandText-light font-light mt-1">
              Create a new business profile in {siteConfig.name}.
            </p>
          </div>
          
          <AddListingForm 
            categories={categories || []} 
            cities={cities || []} 
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
