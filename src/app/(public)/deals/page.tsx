import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tag, Calendar, ExternalLink } from "lucide-react";
import CopyCodeButton from "./CopyCodeButton";
import { Metadata } from "next";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Local Deals & Coupons | ${siteConfig.name}`,
  description: `Save big at your favorite dining, shopping, and service businesses with our exclusive local deals and coupons.`,
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function DealsFeedPage() {
  const supabase = await createClient();

  const { data: deals, error } = await supabase
    .from("deals")
    .select(`
      *,
      business:businesses(name, slug, category:categories(name))
    `)
    .order("created_at", { ascending: false });

  const displayDeals = !error && deals ? deals : [];

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="border-b border-brandBorder-light pb-6">
            <h1 className="text-3xl font-extrabold text-brandText-dark font-heading tracking-tight flex items-center space-x-2">
              <Tag className="h-7 w-7 text-brandRed" />
              <span>Local Deals & Coupons</span>
            </h1>
            <p className="text-sm text-brandText-light mt-1 font-light">
              Save big at your favorite ${siteConfig.region.name} dining, shopping, and service businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayDeals.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-card border border-brandBorder-light italic text-sm text-brandText-light">
                No active coupon deals or discount offers registered. Check back shortly!
              </div>
            ) : (
              displayDeals.map((deal) => {
                const isExpired = deal.end_date && new Date(deal.end_date) < new Date();
                return (
                  <article
                    key={deal.id}
                    className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    {/* Expiry / Status Badge */}
                    {isExpired && (
                      <span className="absolute top-2 right-2 text-[8px] font-bold text-white bg-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">
                        Expired
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-brandRed uppercase tracking-wider bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-btn">
                          {deal.business?.category?.name || "Local Deal"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-brandText-dark font-heading leading-tight">
                        {deal.title}
                      </h3>

                      <p className="text-xs text-brandText-light font-light leading-relaxed">
                        {deal.description || "Grab this local discount before it expires!"}
                      </p>
                    </div>

                    <div className="space-y-3.5 pt-2 border-t border-brandBorder-light/65 text-xs">
                      {/* Host business */}
                      <div className="flex justify-between items-center">
                        <span className="text-brandText-light font-light">Offered by:</span>
                        <Link
                          href={`/listings/${deal.business?.slug}`}
                          className="font-bold text-brandText-dark hover:text-brandRed flex items-center space-x-1"
                        >
                          <span>{deal.business?.name}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>

                      {/* Dates */}
                      {deal.end_date && (
                        <div className="flex items-center space-x-1.5 text-brandText-light">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>
                            Valid until {new Date(deal.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {/* Coupon code action */}
                      {deal.coupon_code && (
                        <CopyCodeButton code={deal.coupon_code} id={deal.id} />
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
