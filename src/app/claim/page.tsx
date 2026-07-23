"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, MapPin, Building2, CheckCircle } from "lucide-react";

export default function ClaimSearchPage() {
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function searchUnclaimed() {
      if (query.trim().length < 2) {
        setBusinesses([]);
        return;
      }
      setLoading(true);

      const { data, error } = await supabase
        .from("businesses")
        .select(`
          id,
          name,
          slug,
          address,
          status,
          city:cities(name)
        `)
        .eq("status", "unclaimed")
        .ilike("name", `%${query}%`)
        .limit(10);

      setLoading(false);
      if (!error && data) {
        setBusinesses(data);
      }
    }

    const timer = setTimeout(searchUnclaimed, 300);
    return () => clearTimeout(timer);
  }, [query, supabase]);

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />

      <main className="flex-grow py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brandRed text-white mb-4 shadow-sm">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-brandText-dark font-heading tracking-tight mb-2">
              Claim Your Business
            </h1>
            <p className="text-sm text-brandText-light font-light max-w-sm mx-auto">
              Search for your business in our directory to begin verification.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative mb-8">
            <div className="flex items-center bg-white p-2 rounded-full shadow-sm border border-brandBorder-light focus-within:ring-2 focus-within:ring-brandRed/20 focus-within:border-brandRed transition-all">
              <Search className="h-5 w-5 text-brandText-light ml-4 mr-3" />
              <input
                type="text"
                placeholder="Enter your business name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent py-2 text-sm text-brandText-dark focus:outline-none placeholder-brandText-light"
              />
            </div>
          </div>

          {/* Results list */}
          <div className="bg-white rounded-xl border border-brandBorder-light shadow-sm overflow-hidden">
            {loading ? (
              <div className="text-center py-10 text-sm text-brandText-light flex flex-col items-center">
                <div className="h-6 w-6 rounded-full border-2 border-brandBorder-light border-t-accent animate-spin mb-3"></div>
                Searching listings...
              </div>
            ) : query.trim().length < 2 ? (
              <div className="text-center py-10 text-sm text-brandText-light">
                Type at least 2 characters to search.
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-10 px-6 text-sm text-brandText-light space-y-2 bg-slate-50/50">
                <p>No unclaimed businesses found matching &ldquo;<span className="font-bold">{query}</span>&rdquo;.</p>
                <p className="text-xs max-w-sm mx-auto">
                  If your business is already claimed, it will not appear here. Contact support for help.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-brandBorder-light">
                {businesses.map((bus) => (
                  <Link
                    key={bus.id}
                    href={`/claim/${bus.slug}`}
                    className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-4 truncate">
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-brandText-light group-hover:bg-brandRed/10 group-hover:text-brandRed transition-colors flex-shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-sm font-bold text-brandText-dark group-hover:text-brandRed transition-colors font-heading mb-0.5">
                          {bus.name}
                        </h3>
                        <p className="text-xs text-brandText-light truncate flex items-center">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span>
                            {bus.address || "No address listed"} &bull; {bus.city?.name || "Henry County"}, GA
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-badge-verified px-3 py-1.5 rounded-full border border-badge-verified/20 ml-4 flex-shrink-0">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Available</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
