/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingDetailClient from "./ListingDetailClient";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  let { slug } = await params;
  slug = slug.toLowerCase().replace(/\s+/g, "-");
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, description, city:cities(name)")
    .eq("slug", slug)
    .maybeSingle();

  if (business) {
    return {
      title: `${business.name} in ${(business.city as any)?.name || siteConfig.name} | Directory`,
      description: business.description?.substring(0, 160) || `View details, reviews, and contact info for ${business.name}.`,
    };
  }

  return { title: "Listing Not Found" };
}

export default async function ListingDetailPage({ params }: PageProps) {
  let { slug } = await params;
  
  if (slug.includes(" ") || slug !== slug.toLowerCase()) {
    slug = slug.toLowerCase().replace(/\s+/g, "-");
  }

  const supabase = await createClient();

  // Try to load business details from DB
  const { data: dbBusiness } = await supabase
    .from("businesses")
    .select(`
      *,
      category:categories(*),
      city:cities(*),
      media:listing_media(*)
    `)
    .eq("slug", slug)
    .maybeSingle();

  // Fetch Session User
  const { data: { user } } = await supabase.auth.getUser();

  const business = dbBusiness;
  let reviews: any[] = [];
  let qnas: any[] = [];

  if (dbBusiness) {
    // Fetch associated reviews
    const { data: revList } = await supabase
      .from("reviews")
      .select("*, author:profiles(*)")
      .eq("business_id", dbBusiness.id)
      .order("created_at", { ascending: false });

    // Fetch associated Q&A
    const { data: qnaList } = await supabase
      .from("qna")
      .select("*, visitor:profiles(*)")
      .eq("business_id", dbBusiness.id)
      .order("created_at", { ascending: false });

    reviews = revList || [];
    qnas = qnaList || [];
  } else {
    notFound();
  }

  // Generate schema.org LocalBusiness JSON-LD
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": business.name,
    "image": business.media?.[0]?.url || "",
    "url": `${siteConfig.url}/listings/${business.slug}`,
    "telephone": business.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": business.address,
      "addressLocality": business.city?.name,
      "addressRegion": "GA",
      "addressCountry": "US"
    },
    "description": business.description,
    "aggregateRating": business.rating_avg ? {
      "@type": "AggregateRating",
      "ratingValue": business.rating_avg.toString(),
      "reviewCount": business.review_count?.toString() || "1"
    } : undefined
  };

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header sticky={false} />
      <main className="flex-grow">
        <ListingDetailClient 
          business={business} 
          user={user} 
          dbReviews={reviews} 
          dbQnas={qnas} 
        />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Footer />
    </div>
  );
}
