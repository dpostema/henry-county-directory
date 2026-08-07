import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { siteConfig } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const supabase = await createClient();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  // Businesses (Listings)
  const { data: businesses } = await supabase.from('businesses').select('slug, updated_at');
  if (businesses) {
    businesses.forEach((b) => {
      dynamicRoutes.push({
        url: `${baseUrl}/listings/${b.slug}`,
        lastModified: new Date(b.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  }

  // Articles
  const { data: articles } = await supabase.from('articles').select('slug, created_at');
  if (articles) {
    articles.forEach((a) => {
      dynamicRoutes.push({
        url: `${baseUrl}/blog/${a.slug}`,
        lastModified: new Date(a.created_at || new Date()),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });
  }

  // Best of Lists
  const { data: bestOf } = await supabase.from('best_of_lists').select('slug');
  if (bestOf) {
    bestOf.forEach((b) => {
      dynamicRoutes.push({
        url: `${baseUrl}/best-of/${b.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  }

  // Cities
  const { data: cities } = await supabase.from('cities').select('slug');
  if (cities) {
    cities.forEach((c) => {
      dynamicRoutes.push({
        url: `${baseUrl}/city/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  }

  // Categories
  const { data: categories } = await supabase.from('categories').select('slug');
  if (categories) {
    categories.forEach((c) => {
      dynamicRoutes.push({
        url: `${baseUrl}/category/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  }

  // Category x City
  if (categories && cities) {
    categories.forEach((cat) => {
      cities.forEach((cit) => {
        dynamicRoutes.push({
          url: `${baseUrl}/category/${cat.slug}/${cit.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      });
    });
  }

  return [...staticRoutes, ...dynamicRoutes];
}
