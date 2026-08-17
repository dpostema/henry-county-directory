"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createCuratedListAction } from "../listings/actions";
import { Plus, Sparkles, User, Star } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function CuratedListsPage() {
  const [lists, setLists] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);

    // 1. Get user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    // 2. Fetch lists
    const { data: listData } = await supabase
      .from("best_of_lists")
      .select(`
        *,
        author:profiles(full_name),
        items:best_of_list_items(
          rank,
          business:businesses(name, slug, rating_avg, review_count)
        )
      `)
      .order("created_at", { ascending: false });
    
    // Sort items by rank inside lists
    const sortedLists = (listData || []).map((l: any) => {
      if (l.items) {
        l.items.sort((a: any, b: any) => a.rank - b.rank);
      }
      return l;
    });
    setLists(sortedLists);

    // 3. Fetch businesses for list builder dropdown
    const { data: busData } = await supabase
      .from("businesses")
      .select("id, name")
      .order("name", { ascending: true });
    setBusinesses(busData || []);

    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (selectedIds.length === 0) {
      setFormError("Please select at least one business for your list.");
      return;
    }
    setFormLoading(true);

    const res = await createCuratedListAction(title, description, selectedIds);
    setFormLoading(false);

    if (res?.error) {
      setFormError(res.error);
    } else if (res?.success) {
      setFormSuccess(res.success);
      setTitle("");
      setDescription("");
      setSelectedIds([]);
      setShowCreateForm(false);
      loadData();
    }
  };

  const toggleBusinessSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brandBg-app flex flex-col justify-between">
        <Header />
        <div className="text-center py-16 text-sm text-brandText-light">Loading curated lists...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-10">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-brandBorder-light pb-6 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-brandText-dark font-heading tracking-tight flex items-center space-x-2">
                <Sparkles className="h-7 w-7 text-brandRed" />
                <span>Curated &ldquo;Best Of&rdquo; Lists</span>
              </h1>
              <p className="text-sm text-brandText-light mt-1 font-light">
                Discover local favorites compiled by residents and administrators of ${siteConfig.region.name}.
              </p>
            </div>

            {user ? (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold px-4 py-2.5 rounded-btn shadow-sm transition flex items-center space-x-1.5 self-start"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Create Curated List</span>
              </button>
            ) : (
              <Link
                href="/auth/login?redirectTo=/lists"
                className="bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold px-4 py-2.5 rounded-btn shadow-sm transition inline-flex items-center space-x-1.5 self-start"
              >
                <User className="h-4 w-4" />
                <span>Log In to Curated Lists</span>
              </Link>
            )}
          </div>

          {/* Builder Form Modal/Collapsible */}
          {showCreateForm && (
            <div className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-4">
              <h2 className="text-base font-bold text-brandText-dark font-heading">
                Compile Your Curated List
              </h2>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-dark mb-1">
                      List Title (e.g. Best Burgers in McDonough)
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter title..."
                      className="w-full p-2.5 text-sm border border-brandBorder-light rounded-btn"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-dark mb-1">
                      Short Description / Reason
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Why did you build this list..."
                      className="w-full p-2.5 text-sm border border-brandBorder-light rounded-btn"
                    />
                  </div>
                </div>

                {/* Businesses Multi-Select Checklist */}
                <div>
                  <label className="block text-xs font-semibold text-brandText-dark mb-1">
                    Select Listings to Include ({selectedIds.length} Selected)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-brandBorder-light rounded-btn bg-slate-50">
                    {businesses.map((bus) => (
                      <label
                        key={bus.id}
                        className="flex items-center space-x-2 text-xs text-brandText-medium p-1 cursor-pointer hover:text-brandRed"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(bus.id)}
                          onChange={() => toggleBusinessSelect(bus.id)}
                          className="rounded text-brandRed focus:ring-brandRed"
                        />
                        <span className="truncate">{bus.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="p-3 text-xs text-brandRed bg-brandRed-muted rounded-btn border border-brandRed/20">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 text-xs text-badge-verified bg-emerald-50 rounded-btn border border-badge-verified/20">
                    {formSuccess}
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold px-4 py-2.5 rounded-btn shadow-sm transition disabled:opacity-50"
                  >
                    {formLoading ? "Publishing List..." : "Publish Curated List"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="border border-brandBorder-light bg-white text-brandText-dark text-xs font-bold px-4 py-2.5 rounded-btn hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Curated Lists Grid */}
          <div className="space-y-6">
            {lists.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-card border border-brandBorder-light italic text-sm text-brandText-light">
                No curated lists exist yet. Be the first to create one!
              </div>
            ) : (
              lists.map((list) => (
                <article
                  key={list.id}
                  className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start border-b border-brandBorder-light pb-3">
                    <div>
                      <h2 className="text-lg font-black text-brandText-dark font-heading">
                        {list.title}
                      </h2>
                      {list.description && (
                        <p className="text-xs text-brandText-light font-light mt-0.5">
                          {list.description}
                        </p>
                      )}
                    </div>

                    <div className="text-[10px] text-brandText-light flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>by {list.author?.full_name || "Henry Local"}</span>
                    </div>
                  </div>

                  {/* List Items */}
                  <div className="divide-y divide-brandBorder-light bg-slate-50/50 rounded-xl overflow-hidden border border-brandBorder-light/50">
                    {list.items?.length === 0 ? (
                      <p className="text-xs text-brandText-light italic p-4">No businesses inside this list.</p>
                    ) : (
                      list.items?.map((item: any, idx: number) => (
                        <div
                          key={item.business?.slug || idx}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center space-x-3 truncate">
                            <span className="h-6 w-6 bg-slate-200 text-brandText-dark font-bold text-xs rounded-full flex items-center justify-center">
                              {item.rank}
                            </span>
                            <div className="truncate">
                              <Link
                                href={`/listings/${item.business?.slug}`}
                                className="text-xs font-bold text-brandText-dark hover:text-brandRed hover:underline block truncate"
                              >
                                {item.business?.name}
                              </Link>
                            </div>
                          </div>

                          <div className="flex items-center text-xs text-badge-rating font-bold space-x-1">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{item.business?.rating_avg?.toFixed(1) || "0.0"}</span>
                            <span className="text-[10px] font-light text-brandText-light">
                              ({item.business?.review_count || 0})
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
