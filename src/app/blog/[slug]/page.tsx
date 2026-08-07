import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt")
    .eq("slug", slug)
    .maybeSingle();

  if (article) {
    return {
      title: `${article.title} | ${siteConfig.name} Blog`,
      description: article.excerpt || `Read this article on ${siteConfig.name}.`,
    };
  }

  const mockTitle = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${mockTitle} | ${siteConfig.name} Blog`,
    description: `Read this article on ${siteConfig.name}.`,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: dbArticle } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const mockArticles = [
    {
      id: "b1",
      title: "Top 5 Places to Visit in Henry County this Summer",
      slug: "top-5-places-summer",
      excerpt: "Get ready for a sun-filled adventure. Here are our top picks for family fun in the area.",
      content: "<p>Summer is almost here, and Henry County is full of incredible places to explore with your family. Here is a curated list of our top 5 destinations.</p><p>1. Local Park... (This is mock content for demonstration)</p>",
      created_at: new Date().toISOString(),
      cover_image_url: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1000&auto=format&fit=crop&q=60"
    },
    {
      id: "b2",
      title: "How to Support Local Businesses During the Holidays",
      slug: "support-local-holidays",
      excerpt: "Your guide to shopping local and making a big impact in your community.",
      content: "<p>Shopping local makes a massive difference in our community's economy. When you buy from a small business, you are supporting a neighbor.</p><p>Here are some ways to help: Shop local, leave reviews, and spread the word.</p>",
      created_at: "2026-08-20T00:00:00Z",
      cover_image_url: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1000&auto=format&fit=crop&q=60"
    }
  ];

  const article = dbArticle || mockArticles.find(a => a.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />

      <main className="flex-grow py-12">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-xs font-semibold text-brandText-light mb-8">
            <Link href="/" className="hover:text-brandRed">HOME</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className="hover:text-brandRed">BLOG</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="uppercase text-brandText-medium truncate">{article.title}</span>
          </nav>

          <header className="mb-10 text-center">
            <p className="text-sm text-brandText-light mb-4">
              {new Date(article.created_at).toLocaleDateString()}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brandText-dark font-heading tracking-tight leading-tight mb-6">
              {article.title}
            </h1>
            {article.cover_image_url && (
              <div className="relative w-full aspect-video rounded-card overflow-hidden shadow-sm">
                <Image
                  src={article.cover_image_url}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  priority
                />
              </div>
            )}
          </header>

          <div
            className="prose prose-brand max-w-none text-brandText-medium"
            dangerouslySetInnerHTML={{ __html: article.content || `<p>${article.excerpt}</p>` }}
          />
        </article>
      </main>

      <Footer />
    </div>
  );
}
