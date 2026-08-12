import { createClient } from "@/utils/supabase/server";
import { searchBusinesses } from "@/services/search";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";

import { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cityName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    title: `Best Businesses in ${cityName}, GA | ${siteConfig.name}`,
    description: `Discover the top-rated local businesses, restaurants, hotels, and services in ${cityName}, Georgia. Read reviews and find what you need.`,
  };
}

export default async function CityPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: city } = await supabase.from("cities").select("name").eq("slug", slug).maybeSingle();
  const cityName = city?.name || `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;


  const dbListings = await searchBusinesses(supabase, { citySlug: slug });

  const listings = dbListings || [];

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />

      {/* Hero Banner */}
      <section className="bg-white border-b border-brandBorder-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[11px] font-bold text-brandText-light mb-4 uppercase tracking-wider whitespace-nowrap overflow-x-auto pb-1 hide-scrollbar">
            <Link href="/" className="hover:text-brandRed transition-colors flex-shrink-0">Home</Link>
            <span className="text-brandBorder-light flex-shrink-0">/</span>
            <span className="text-brandText-light flex-shrink-0">City</span>
            <span className="text-brandBorder-light flex-shrink-0">/</span>
            <span className="text-brandRed flex-shrink-0 truncate">{cityName}</span>
          </nav>

          <h1 className="text-2xl font-heading tracking-tight">
            <span className="font-extrabold text-brandText-dark">Businesses in</span>{" "}
            <span className="font-normal text-brandText-medium">{cityName}, GA</span>
          </h1>
          <p className="text-sm text-brandText-light font-light mt-1">
            Browse top rated businesses and local offerings in {cityName}.
          </p>
        </div>
      </section>

      <main className="flex-grow py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Listings Grid */}
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-brandBorder-light">
              <p className="text-sm text-brandText-light">No listings found in this city.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {listings.map((business) => (
                <div key={business.id}>
                  <ListingCard business={business} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
