import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default async function ModerationDashboard() {
  const supabase = await createClient();
  
  // Fetch pending reviews
  const { data: pendingReviews } = await supabase
    .from("reviews")
    .select("*, business:businesses(name), author:profiles(full_name)")
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold font-heading mb-6">Content Moderation</h1>
        
        <div className="bg-white p-6 rounded-xl border border-brandBorder-light shadow-sm">
          <h2 className="text-lg font-bold mb-4">Pending Reviews</h2>
          {pendingReviews && pendingReviews.length > 0 ? (
            <div className="space-y-4">
              {pendingReviews.map((review: any) => (
                <div key={review.id} className="p-4 border rounded-lg bg-slate-50">
                  <p className="font-bold">{review.business?.name}</p>
                  <p className="text-sm">By: {review.author?.full_name}</p>
                  <p className="mt-2 text-sm italic">"{review.comment}"</p>
                  <p className="mt-1 text-xs text-brandRed">Rating: {review.rating}/5</p>
                  <div className="mt-3 flex space-x-2">
                    <button className="px-3 py-1 bg-badge-verified text-white text-xs font-bold rounded">Approve</button>
                    <button className="px-3 py-1 bg-brandRed text-white text-xs font-bold rounded">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brandText-light">No pending reviews to moderate.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
