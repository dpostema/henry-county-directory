import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";
import Image from "next/image";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & Local Guides | Henry County Directory",
  description: "Read the latest news, local guides, and stories from Henry County businesses and residents.",
};

export default async function BlogIndexPage() {
  const supabase = await createClient();
  const { data: dbArticles } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, created_at, cover_image_url")
    .order("created_at", { ascending: false });

  const mockArticles = [
    {
      id: "b1",
      title: "Top 5 Places to Visit in Henry County this Summer",
      slug: "top-5-places-summer",
      excerpt: "Get ready for a sun-filled adventure. Here are our top picks for family fun in the area.",
      created_at: new Date().toISOString(),
      cover_image_url: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: "b2",
      title: "How to Support Local Businesses During the Holidays",
      slug: "support-local-holidays",
      excerpt: "Your guide to shopping local and making a big impact in your community.",
      created_at: "2026-08-20T00:00:00Z",
      cover_image_url: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&auto=format&fit=crop&q=60"
    }
  ];

  const articles = dbArticles && dbArticles.length > 0 ? dbArticles : mockArticles;

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />

      {/* Hero Banner */}
      <section className="bg-white border-b border-brandBorder-light text-center py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <BookOpen className="h-8 w-8 text-brandRed mx-auto mb-4" />
          <h1 className="text-3xl font-heading tracking-tight mb-2">
            <span className="font-extrabold text-brandText-dark">Local Insights</span>{" "}
            <span className="font-normal text-brandText-medium">&amp; Guides</span>
          </h1>
          <p className="text-sm text-brandText-light font-light max-w-xl mx-auto leading-relaxed">
            Discover the latest updates, tips, and spotlight stories on the businesses and community of Henry County.
          </p>
        </div>
      </section>

      <main className="flex-grow py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link key={article.id} href={`/blog/${article.slug}`} className="group block h-full">
                <article className="bg-white rounded-xl overflow-hidden border border-brandBorder-light hover:shadow-md transition-all duration-300 flex flex-col h-full">
                  {article.cover_image_url ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <Image
                        src={article.cover_image_url}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] w-full bg-slate-100 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-brandText-light opacity-30" />
                    </div>
                  )}
                  <div className="p-6 flex-grow flex flex-col">
                    <span className="text-[10px] font-bold text-brandRed uppercase tracking-wider block mb-2">
                      Local Guide
                    </span>
                    <h2 className="text-lg font-bold text-brandText-dark font-heading group-hover:text-brandRed transition-colors leading-snug mb-3">
                      {article.title}
                    </h2>
                    <p className="text-sm text-brandText-medium font-light line-clamp-3 mb-4 flex-grow">
                      {article.excerpt}
                    </p>
                    <span className="text-xs text-brandText-light block mt-auto border-t border-brandBorder-light pt-4">
                      {new Date(article.created_at).toLocaleDateString()} by Admin
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
