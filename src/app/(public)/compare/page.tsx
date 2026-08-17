"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Scale, Trash, Star, Phone, Globe, MapPin, ExternalLink } from "lucide-react";
import { fetchCompareBusinesses } from "./actions";
import { siteConfig } from "@/config/site";

export default function CompareListingsPage() {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [idsLoaded, setIdsLoaded] = useState(false);

  // Step 1: Read IDs from localStorage (client-side only)
  useEffect(() => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    try {
      const saved = localStorage.getItem("compare_listings");
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids)) {
          // Filter out any corrupted/non-UUID entries
          const validIds = ids.filter((id: unknown) => typeof id === "string" && UUID_RE.test(id));
          // Clean up localStorage if there were invalid entries
          if (validIds.length !== ids.length) {
            localStorage.setItem("compare_listings", JSON.stringify(validIds));
          }
          if (validIds.length > 0) {
            setCompareIds(validIds);
          }
        }
      }
    } catch (err) {
      console.error("[Compare] Error reading localStorage:", err);
      localStorage.removeItem("compare_listings");
    }
    setIdsLoaded(true);
  }, []);

  // Step 2: Fetch businesses from server action when IDs are loaded
  useEffect(() => {
    if (!idsLoaded) return;

    if (compareIds.length === 0) {
      setBusinesses([]);
      setLoading(false);
      return;
    }

    async function loadCompared() {
      setLoading(true);
      try {
        const result = await fetchCompareBusinesses(compareIds);
        if (result.error) {
          console.error("[Compare] Server error:", result.error);
        }
        setBusinesses(result.data || []);
      } catch (err) {
        console.error("[Compare] Fetch error:", err);
        setBusinesses([]);
      }
      setLoading(false);
    }

    loadCompared();
  }, [compareIds, idsLoaded]);

  const handleRemove = useCallback((id: string) => {
    setCompareIds((prev) => {
      const updated = prev.filter((item) => item !== id);
      localStorage.setItem("compare_listings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setCompareIds([]);
    setBusinesses([]);
    localStorage.removeItem("compare_listings");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brandBg-app flex flex-col justify-between">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-3">
            <Scale className="h-8 w-8 text-brandText-light mx-auto animate-pulse" />
            <p className="text-sm text-brandText-light">Loading comparison data...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-brandBorder-light pb-6 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-brandText-dark font-heading tracking-tight flex items-center space-x-2">
                <Scale className="h-7 w-7 text-brandRed" />
                <span>Compare Listings</span>
              </h1>
              <p className="text-sm text-brandText-light mt-1 font-light">
                Compare key attributes of local ${siteConfig.region.name} businesses side-by-side.
              </p>
            </div>

            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-brandRed hover:underline flex items-center space-x-1"
              >
                <Trash className="h-4 w-4" />
                <span>Clear Comparison Tray</span>
              </button>
            )}
          </div>

          {businesses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-card border border-brandBorder-light space-y-4">
              <Scale className="h-12 w-12 text-brandText-light mx-auto" />
              <h2 className="text-base font-bold text-brandText-dark font-heading">Comparison Tray Empty</h2>
              <p className="text-xs text-brandText-light max-w-sm mx-auto font-light leading-relaxed">
                Add business listings to your comparison tray from their details pages to evaluate them side-by-side.
              </p>
              <Link
                href="/"
                className="inline-block bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold px-5 py-2.5 rounded-btn shadow-sm transition"
              >
                Browse Listings
              </Link>
            </div>
          ) : (
            <div className="bg-brandBg-card rounded-card border border-brandBorder-light shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px] text-xs">
                <thead>
                  <tr className="border-b border-brandBorder-light bg-slate-50">
                    <th className="p-4 w-1/4 font-semibold text-brandText-light uppercase tracking-wider">Features</th>
                    {businesses.map((bus) => (
                      <th key={bus.id} className="p-4 w-1/4 font-bold text-brandText-dark text-sm relative">
                        <div className="flex justify-between items-start">
                          <Link href={`/listings/${bus.slug}`} className="hover:text-brandRed font-heading block pr-6">
                            {bus.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemove(bus.id)}
                            className="text-brandText-light hover:text-brandRed absolute top-3.5 right-3"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brandBorder-light">
                  {/* Category */}
                  <tr>
                    <td className="p-4 font-semibold text-brandText-medium">Category</td>
                    {businesses.map((bus) => (
                      <td key={bus.id} className="p-4 text-brandText-dark font-medium">
                        {bus.category?.name || "Services"}
                      </td>
                    ))}
                  </tr>

                  {/* City */}
                  <tr>
                    <td className="p-4 font-semibold text-brandText-medium">City Location</td>
                    {businesses.map((bus) => (
                      <td key={bus.id} className="p-4 text-brandText-dark">
                        {bus.city?.name || siteConfig.region.name}, GA
                      </td>
                    ))}
                  </tr>

                  {/* Rating / reviews */}
                  <tr>
                    <td className="p-4 font-semibold text-brandText-medium">Star Ratings</td>
                    {businesses.map((bus) => (
                      <td key={bus.id} className="p-4">
                        <div className="flex items-center text-badge-rating font-bold space-x-1">
                          <Star className="h-4 w-4 fill-current" />
                          <span>{(bus.rating_avg || 0).toFixed(1)}</span>
                          <span className="text-[10px] text-brandText-light font-light">
                            ({bus.review_count || 0} reviews)
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Address */}
                  <tr>
                    <td className="p-4 font-semibold text-brandText-medium">Physical Address</td>
                    {businesses.map((bus) => (
                      <td key={bus.id} className="p-4 text-brandText-medium leading-relaxed font-light">
                        <div className="flex items-start space-x-1">
                          <MapPin className="h-4 w-4 text-brandText-light flex-shrink-0 mt-0.5" />
                          <span>{bus.address || "No address listed"}</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Phone */}
                  <tr>
                    <td className="p-4 font-semibold text-brandText-medium">Phone Contacts</td>
                    {businesses.map((bus) => (
                      <td key={bus.id} className="p-4 text-brandText-medium">
                        {bus.phone ? (
                          <a href={`tel:${bus.phone}`} className="flex items-center space-x-1 hover:text-brandRed hover:underline">
                            <Phone className="h-3.5 w-3.5 text-brandText-light" />
                            <span>{bus.phone}</span>
                          </a>
                        ) : (
                          <span className="italic text-brandText-light font-light">No phone</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Website */}
                  <tr>
                    <td className="p-4 font-semibold text-brandText-medium">Website Link</td>
                    {businesses.map((bus) => (
                      <td key={bus.id} className="p-4">
                        {bus.website ? (
                          <a
                            href={bus.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-brandRed hover:underline flex items-center space-x-1"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            <span>Visit Site</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="italic text-brandText-light font-light">No website</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
