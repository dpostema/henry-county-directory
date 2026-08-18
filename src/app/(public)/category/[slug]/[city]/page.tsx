import { createClient } from "@/utils/supabase/server";
import { searchBusinesses } from "@/services/search";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Metadata } from "next";

// Mock Categories
const CATEGORY_NAMES: Record<string, string> = {
  foods: "Food & Restaurants",
  hotels: "Hotels & Lodges",
  jobs: "Local Jobs",
  medicals: "Clinics & Medical",
  services: "Local Services",
  shopping: "Shops & Shopping",
  automotive: "Automotive Services",
};

// Mock Cities
const CITY_NAMES: Record<string, string> = {
  mcdonough: "McDonough",
  stockbridge: "Stockbridge",
  hampton: "Hampton",
  "locust-grove": "Locust Grove",
};

interface PageProps {
  params: Promise<{
    slug: string;
    city: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, city } = await params;
  const categoryTitle = CATEGORY_NAMES[slug] || `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  const cityName = CITY_NAMES[city] || `${city.charAt(0).toUpperCase()}${city.slice(1)}`;

  return {
    title: `Best ${categoryTitle} in ${cityName}, GA | Directory`,
    description: `Find top-rated ${categoryTitle.toLowerCase()} in ${cityName}, Georgia. Read reviews, compare, and get directions.`,
  };
}

export default async function CategoryCityPage({ params }: PageProps) {
  const { slug, city } = await params;
  const categoryTitle = CATEGORY_NAMES[slug] || `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  const cityName = CITY_NAMES[city] || `${city.charAt(0).toUpperCase()}${city.slice(1)}`;

  const supabase = await createClient();
  const dbListings = await searchBusinesses(supabase, { categorySlug: slug, citySlug: city });

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />

      {/* Hero Banner */}
      <section className="bg-white border-b border-brandBorder-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-2 text-[11px] font-bold text-brandText-light mb-4 uppercase tracking-wider whitespace-nowrap overflow-x-auto pb-1 hide-scrollbar">
            <Link href="/" className="hover:text-brandRed transition-colors flex-shrink-0">Home</Link>
            <span className="text-brandBorder-light flex-shrink-0">/</span>
            <Link href={`/category/${slug}`} className="hover:text-brandRed transition-colors flex-shrink-0">{categoryTitle}</Link>
            <span className="text-brandBorder-light flex-shrink-0">/</span>
            <span className="text-brandRed flex-shrink-0 truncate">{cityName}</span>
          </nav>

          <h1 className="text-2xl font-heading tracking-tight">
            <span className="font-extrabold text-brandText-dark">{categoryTitle}</span>{" "}
            <span className="font-normal text-brandText-medium">in {cityName}, GA</span>
          </h1>
          <p className="text-sm text-brandText-light font-light mt-1">
            Browse top rated {categoryTitle.toLowerCase()} and local offerings in {cityName}.
          </p>
        </div>
      </section>

      <main className="flex-grow py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {(!dbListings || dbListings.length === 0) ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-brandBorder-light">
              <p className="text-sm text-brandText-light">No listings found for {categoryTitle} in {cityName}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {dbListings.map((business) => (
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
