import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Metadata } from "next";
import { Award, ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listTitle = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return {
    title: `${listTitle} | Henry County Best-Of`,
    description: `Discover the top-rated businesses for ${listTitle} in Henry County, carefully curated by local experts and reviews.`,
  };
}

export default async function BestOfPage({ params }: PageProps) {
  const { slug } = await params;
  const listTitle = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const supabase = await createClient();

  // Try to load the best of list and associated businesses
  const { data: dbList } = await supabase
    .from("best_of_lists")
    .select(`
      *,
      items:best_of_list_items(
        *,
        business:businesses(
          *,
          category:categories(*),
          city:cities(*),
          media:listing_media(*)
        )
      )
    `)
    .eq("slug", slug)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listings: any[] = [];
  if (dbList && dbList.items && dbList.items.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listings = dbList.items.map((item: any) => item.business).filter(Boolean);
  }

  // Generate schema.org ItemList JSON-LD
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listTitle,
    "description": `Top-rated businesses for ${listTitle} in Henry County.`,
    "itemListElement": listings.map((business, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "LocalBusiness",
        "name": business.name,
        "url": `https://henrycountydirectory.com/listings/${business.slug}`,
        "image": business.media?.[0]?.url || "",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": business.address,
          "addressLocality": business.city?.name,
          "addressRegion": "GA",
        },
        "aggregateRating": business.rating_avg ? {
          "@type": "AggregateRating",
          "ratingValue": business.rating_avg.toString(),
          "reviewCount": business.review_count?.toString() || "1"
        } : undefined
      }
    }))
  };

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />

      <main className="flex-grow py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-xs font-semibold text-brandText-light mb-4">
            <Link href="/" className="hover:text-brandRed">HOME</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="uppercase text-brandText-medium">Best Of</span>
            <ChevronRight className="h-3 w-3" />
            <span className="uppercase text-brandText-medium">{listTitle}</span>
          </nav>

          {/* Heading */}
          <div className="mb-12 border-b border-brandBorder-light pb-6">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-brandRed" />
              <h1 className="text-3xl font-extrabold text-brandText-dark font-heading tracking-tight">
                {listTitle}
              </h1>
            </div>
            <p className="text-sm text-brandText-light font-light mt-2 max-w-3xl">
              {dbList?.description || `Explore our curated list of the top-rated businesses for ${listTitle} in Henry County. Support local favorites and discover new gems.`}
            </p>
          </div>

          {/* Listings List Layout for Best Of */}
          <div className="space-y-8">
            {listings.length === 0 ? (
              <div className="text-center py-16 bg-brandBg-card rounded-card border border-brandBorder-light shadow-sm">
                <p className="text-sm text-brandText-light">No businesses found in this list.</p>
              </div>
            ) : (
              listings.map((business, index) => (
                <div key={business.id} className="relative">
                  <div className="absolute -left-4 top-4 bg-brandRed text-white h-8 w-8 rounded-full flex items-center justify-center font-bold z-10 shadow-md">
                    {index + 1}
                  </div>
                  <div className="pl-6">
                    <ListingCard business={business} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <Footer />
    </div>
  );
}
