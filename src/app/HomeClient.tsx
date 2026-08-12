"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { searchBusinesses } from "@/services/search";
import {
  Utensils, Hotel, Briefcase, HeartPulse, Wrench, ShoppingBag, Car,
  Search, ChevronLeft, ChevronRight, ArrowRight
, ChevronDown } from "lucide-react";

// Categories
const CATEGORIES = [
  { name: "Foods", slug: "foods", icon: Utensils },
  { name: "Hotels", slug: "hotels", icon: Hotel },
  { name: "Jobs", slug: "jobs", icon: Briefcase },
  { name: "Medicals", slug: "medicals", icon: HeartPulse },
  { name: "Services", slug: "services", icon: Wrench },
  { name: "Shopping", slug: "shopping", icon: ShoppingBag },
  { name: "Automotive", slug: "automotive", icon: Car }
];

// Destinations
const DESTINATIONS = [
  { name: "McDonough", slug: "mcdonough", count: 20, image: "/mcDonough.png" },
  { name: "Stockbridge", slug: "stockbridge", count: 6, image: "/stockbridge-ga.avif" },
  { name: "Hampton", slug: "hampton", count: 12, image: "/hampton.jpg" },
  { name: "Locust Grove", slug: "locust-grove", count: 4, image: "/locustgrove.jpg" }
];



export default function HomeClient({ initialListings }: { initialListings?: any[] }) {
  const [listings, setListings] = useState<any[]>(initialListings || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [activeTab, setActiveTab] = useState<any>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const destinationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (initialListings || []).forEach(listing => {
      const slug = listing.city?.slug;
      if (slug) {
        counts[slug] = (counts[slug] || 0) + 1;
      }
    });
    return counts;
  }, [initialListings]);

  const dynamicDestinations = useMemo(() => {
    return DESTINATIONS.map(d => ({
      ...d,
      count: destinationCounts[d.slug] || 0
    }));
  }, [destinationCounts]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // Skip fetching on mount, we already have initialListings
    }

    async function loadData() {
      try {
        const results = await searchBusinesses(supabase, {
          query: searchQuery || undefined,
          citySlug: selectedCity !== "all" ? selectedCity : undefined,
          categorySlug: activeCategory || undefined,
          filterType: activeTab !== "all" ? activeTab : undefined
        });

        if (results && results.length > 0) {
          setListings(results);
        } else {
          setListings([]);
        }
      } catch (err) {
        console.error("Failed to load listings:", err);
        setListings([]);
      }
    }

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCity, activeTab, activeCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Full Background
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[500px] lg:min-h-[600px] flex items-center justify-center pt-8 pb-16">
        <div className="absolute inset-0 z-0 bg-black">
          <Image
            src="/hero-img.jpg"
            alt="City Background"
            fill
            className="object-cover object-center opacity-60"
            priority
          />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center mt-10">
          <span className="font-serif text-3xl sm:text-4xl text-white mb-2 italic tracking-wide">explore</span>
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-bold text-white leading-tight tracking-tight mb-4 drop-shadow-sm">
            Discover the Best Spots
          </h1>
          <p className="text-base sm:text-lg text-white/90 font-medium mb-10 drop-shadow-sm">
            Find the best places by clicking below
          </p>

          {/* Search Card */}
          <form onSubmit={handleSearchSubmit} className="w-full bg-white rounded shadow-2xl p-1 flex flex-col sm:flex-row items-stretch">
            {/* What */}
            <div className="flex-1 px-4 py-3 flex items-center border-b sm:border-b-0 border-brandBorder-light">
              <input
                suppressHydrationWarning
                type="text"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-brandText-dark focus:outline-none placeholder-brandText-light font-medium"
              />
            </div>

            {/* Where (Optional, if you want it included in the new design) */}
            <div className="hidden sm:block w-px bg-slate-200 mx-2 my-2"></div>
            <div className="flex-1 px-4 py-3 flex items-center border-b sm:border-b-0 border-brandBorder-light">
              <Select value={selectedCity} onValueChange={(val) => setSelectedCity(val || "all")}>
                <SelectTrigger suppressHydrationWarning className="w-full bg-transparent border-none shadow-none text-sm text-brandText-dark font-medium h-auto p-0 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="mcdonough">McDonough</SelectItem>
                  <SelectItem value="stockbridge">Stockbridge</SelectItem>
                  <SelectItem value="hampton">Hampton</SelectItem>
                  <SelectItem value="locust-grove">Locust Grove</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <button
              suppressHydrationWarning
              type="submit"
              className="bg-[#ff385c] hover:bg-[#e31c5f] text-white text-sm font-bold px-8 py-4 rounded transition-colors flex items-center justify-center space-x-2 whitespace-nowrap ml-1"
            >
              <Search className="h-4 w-4" />
              <span>SEARCH</span>
            </button>
          </form>

          {/* Browse Highlights — Category Icons */}
          <div className="mt-12 text-center w-full max-w-2xl">
            <p className="text-sm text-white/90 mb-5 font-semibold drop-shadow-sm">Or browse the highlights</p>
            <div className="flex flex-wrap justify-center gap-4">
              {CATEGORIES.map((cat) => {
                const IconComp = cat.icon;
                const isActive = activeCategory === cat.slug;
                return (
                  <button
                    suppressHydrationWarning
                    key={cat.slug}
                    onClick={() => setActiveCategory(isActive ? null : cat.slug)}
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 backdrop-blur-sm ${
                      isActive
                        ? "bg-[#ff385c]/90 text-white shadow-lg -translate-y-1"
                        : "bg-black/40 text-white hover:bg-black/60 hover:-translate-y-1 border border-white/20"
                    }`}
                  >
                    <IconComp className="h-6 w-6 mb-1.5 opacity-90" />
                    <span className="text-[10px] font-semibold leading-tight tracking-wide">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SEE HOW IT WORKS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 border-t border-brandBorder-light" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-heading tracking-tight mb-10">
            <span className="font-extrabold text-brandText-dark">See</span>{" "}
            <span className="font-normal text-brandText-medium">How It Works</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "1",
                title: "Choose What To Do",
                desc: "Looking for a cozy hotel to stay, a restaurant to eat, a museum to visit or a mall to do some shopping?"
              },
              {
                num: "2",
                title: "Find What You Want",
                desc: "Search and filter hundreds of listings, read reviews, explore photos and find the perfect spot."
              },
              {
                num: "3",
                title: "Explore Amazing Places",
                desc: "Go and have a good time or even make a booking directly from the listing page. All of those, thanks to HenryCountyDirectory."
              }
            ].map((step) => (
              <div key={step.num} className="relative p-6 flex items-start gap-5">
                <span className="text-6xl font-black text-slate-100 select-none pointer-events-none leading-none -mt-2">
                  {step.num}
                </span>
                <div className="relative w-full">
                  <h3 className="text-sm font-bold text-brandText-dark mb-2 font-heading">{step.title}</h3>
                  <p className="text-sm text-brandText-light font-light leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURED DESTINATIONS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-brandBg-app py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-heading tracking-tight">
              <span className="font-extrabold text-brandText-dark">Featured</span>{" "}
              <span className="font-normal text-brandText-medium">Destinations</span>
            </h2>
            <div className="flex space-x-2">
              <button suppressHydrationWarning className="h-10 w-10 rounded-full bg-white border border-brandBorder-light flex items-center justify-center hover:bg-slate-50 transition-colors text-brandText-light hover:text-brandText-dark">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button suppressHydrationWarning className="h-10 w-10 rounded-full bg-white border border-brandBorder-light flex items-center justify-center hover:bg-slate-50 transition-colors text-brandText-light hover:text-brandText-dark">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dynamicDestinations.map((dest, i) => (
              <Link
                key={dest.slug}
                href={`/city/${dest.slug}`}
                className="group relative h-72 rounded-xl overflow-hidden flex items-end hover:shadow-lg transition-all duration-300"
              >
                <Image
                  src={dest.image}
                  alt={dest.name}
                  width={500}
                  height={400}
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div className="relative z-10 p-5 w-full">
                  <h3 className={`text-xl font-bold font-heading drop-shadow-md ${i === 0 ? "text-brandRed" : "text-white"}`}>
                    {dest.name}
                  </h3>
                  <span className="text-sm text-white/90 font-medium drop-shadow-sm">{dest.count} Listing</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          OUR DIRECTORY — Tabbed listings grid
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-heading tracking-tight mb-6">
            <span className="font-extrabold text-brandText-dark">Our</span>{" "}
            <span className="font-normal text-brandText-medium">Directory</span>
          </h2>

          {/* Tab Bar — left aligned */}
          <div className="flex flex-wrap border-b border-brandBorder-light mb-8 text-xs font-bold tracking-wider uppercase">
            {[
              { label: "All", filter: "all" },
              { label: "Featured", filter: "featured" },
              { label: "Best Rate", filter: "best_rate" },
              { label: "Most View", filter: "most_view" },
              { label: "Popular", filter: "popular" },
              { label: "Ad Directory", filter: "ad" }
            ].map((tab) => (
              <button
                suppressHydrationWarning
                key={tab.filter}
                onClick={() => setActiveTab(tab.filter)}
                className={`px-4 py-3 border-b-2 transition-all ${
                  activeTab === tab.filter
                    ? "border-brandRed text-brandRed"
                    : "border-transparent text-brandText-light hover:text-brandRed"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Listings Grid — 5 columns on desktop */}
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-brandBg-app rounded-xl border border-dashed border-brandBorder-light">
              <p className="text-sm text-brandText-light">No listings found matching your criteria.</p>
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
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SOME TIPS & ARTICLES
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-brandBg-app py-16" id="articles">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-heading tracking-tight">
              <span className="font-extrabold text-brandText-dark">Some Tips</span>{" "}
              <span className="font-normal text-brandText-medium">&amp; Articles</span>
            </h2>
            <Link href="/blog" className="text-sm font-bold text-brandRed hover:underline flex items-center space-x-1">
              <span>All articles</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tag: "Tips, Travel",
                title: "Top 10 Restaurants In Henry County You Must Try",
                date: "Aug 28th, 2026",
                author: "Admin",
                image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60"
              },
              {
                tag: "Culture",
                title: "Best Local Events Happening This Fall Season",
                date: "Aug 20th, 2026",
                author: "HCD Team",
                image: "https://upload.wikimedia.org/wikipedia/commons/3/32/Googleplex_HQ_%28cropped%29.jpg"
              },
              {
                tag: "Location",
                title: "Hidden Gems: Coffee Shops In Downtown McDonough",
                date: "Aug 15th, 2026",
                author: "Staff Writer",
                image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60"
              }
            ].map((article) => (
              <article key={article.title} className="group overflow-hidden rounded-xl border border-brandBorder-light hover:shadow-md transition-all duration-300 bg-white">
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  <Image
                    src={article.image}
                    alt={article.title}
                    width={500}
                    height={300}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold text-brandRed uppercase tracking-wider block mb-2">{article.tag}</span>
                  <h3 className="text-sm font-bold text-brandText-dark mb-2 font-heading leading-snug line-clamp-2 group-hover:text-brandRed transition-colors">
                    {article.title}
                  </h3>
                  <span className="text-xs text-brandText-light block">{article.date} by {article.author}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
