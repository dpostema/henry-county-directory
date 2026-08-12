"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { searchBusinesses } from "@/services/search";
import {
  Utensils, Hotel, Briefcase, HeartPulse, Wrench, ShoppingBag, Car,
  Search, MapPin, SlidersHorizontal, ChevronRight, Filter, Star, Clock, Heart, Check, Building2, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function DirectoryClient({ initialListings }: { initialListings?: any[] }) {
  const [listings, setListings] = useState<any[]>(initialListings || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [activeTab, setActiveTab] = useState<any>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
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

      {/* Directory Header / Search */}
      <section className="bg-white py-12 border-b border-brandBorder-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-brandText-dark font-heading tracking-tight mb-4">
              Explore the Directory
            </h1>
            <p className="text-brandText-light font-light">
              Find the best businesses, services, and places in Henry County.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl shadow-search border border-brandBorder-light p-1.5 flex flex-col sm:flex-row items-stretch max-w-3xl mx-auto">
            {/* What */}
            <div className="flex-1 px-3 py-2.5">
              <label className="text-[10px] font-bold text-brandText-dark uppercase tracking-wider block mb-1">What</label>
              <div className="flex items-center">
                <Search className="h-3.5 w-3.5 text-brandText-light mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Ex: food, service, barber, hotel"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-brandText-dark focus:outline-none placeholder-brandText-light/60"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px bg-brandBorder-light my-2"></div>
            <div className="sm:hidden h-px bg-brandBorder-light mx-3"></div>

            {/* Where */}
            <div className="flex-1 px-3 py-2.5">
              <label className="text-[10px] font-bold text-brandText-dark uppercase tracking-wider block mb-1">Where</label>
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 text-brandText-light mr-2 flex-shrink-0" />
                <Select value={selectedCity} onValueChange={(val) => setSelectedCity(val || "")}>
                  <SelectTrigger className="w-full bg-transparent border-none shadow-none text-sm text-brandText-dark p-0 focus:ring-0 focus:ring-offset-0 h-auto">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    <SelectItem value="mcdonough">McDonough, GA</SelectItem>
                    <SelectItem value="stockbridge">Stockbridge, GA</SelectItem>
                    <SelectItem value="hampton">Hampton, GA</SelectItem>
                    <SelectItem value="locust-grove">Locust Grove, GA</SelectItem>
                    <SelectItem value="flippen">Flippen, GA</SelectItem>
                    <SelectItem value="blacksville">Blacksville, GA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>

          {/* Browse Highlights — Category Icons */}
          <div className="mt-8 text-center">
            <div className="flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((cat) => {
                const IconComp = cat.icon;
                const isActive = activeCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(isActive ? null : cat.slug)}
                    className={`flex items-center px-4 py-2 rounded-full border transition-all duration-200 ${
                      isActive
                        ? "bg-brandRed border-brandRed text-white shadow-md"
                        : "bg-white border-brandBorder-light text-brandText-medium hover:border-brandRed hover:text-brandRed"
                    }`}
                  >
                    <IconComp className="h-4 w-4 mr-2" />
                    <span className="text-xs font-bold leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          OUR DIRECTORY — Tabbed listings grid
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-12 flex-grow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Tab Bar — left aligned */}
          <div className="flex flex-wrap border-b border-brandBorder-light mb-8 text-xs font-bold tracking-wider uppercase">
            {[
              { label: "All", filter: "all" },
              { label: "Featured", filter: "featured" },
              { label: "Best Rate", filter: "best_rate" },
              { label: "Most View", filter: "most_view" },
            ].map((tab) => (
              <button
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

      <Footer />
    </div>
  );
}
