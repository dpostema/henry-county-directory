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

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("name").eq("slug", slug).maybeSingle();
  const categoryTitle = category?.name || `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  return {
    title: `Best ${categoryTitle} in ${siteConfig.region.name}, GA | Directory`,
    description: `Discover top-rated ${categoryTitle.toLowerCase()} and related local businesses in ${siteConfig.region.name}, Georgia.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("name").eq("slug", slug).maybeSingle();
  const categoryTitle = category?.name || `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  const dbListings = await searchBusinesses(supabase, { categorySlug: slug });

  const listings = dbListings || [];

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />

      <main className="flex-grow py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-brandText-light mb-4 whitespace-nowrap overflow-x-auto pb-1 hide-scrollbar">
            <Link href="/" className="hover:text-brandRed flex-shrink-0">HOME</Link>
            <span className="flex-shrink-0">/</span>
            <span className="uppercase text-brandText-medium flex-shrink-0">{slug}</span>
          </nav>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-brandText-dark font-heading tracking-tight">
              {categoryTitle}
            </h1>
            <p className="text-sm text-brandText-light font-light mt-1">
              Browse top rated businesses and local offerings in this category.
            </p>
          </div>

          {/* Listings Grid */}
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-brandBg-card rounded-card border border-brandBorder-light shadow-sm">
              <p className="text-sm text-brandText-light">No listings found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
