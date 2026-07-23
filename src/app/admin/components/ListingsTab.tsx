"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Search, Star, ExternalLink, ChevronDown } from "lucide-react";
import { updateBusinessAdminAction } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ListingsTabProps {
  allListings: any[];
  onRun: (fn: () => Promise<any>, onSuccess?: () => void) => Promise<void>;
  onRefresh: () => void;
}

const PLAN_TIERS = ["free", "featured", "pro", "enterprise"] as const;

const planColors: Record<string, string> = {
  free: "text-slate-400 bg-slate-800 border-slate-700",
  featured: "text-brandRed bg-red-950 border-red-900",
  pro: "text-blue-400 bg-blue-950 border-blue-900",
  enterprise: "text-purple-400 bg-purple-950 border-purple-900",
};

const statusColors: Record<string, string> = {
  claimed: "bg-emerald-950 text-emerald-400 border-emerald-900",
  unclaimed: "bg-slate-800 text-slate-500 border-slate-700",
  suspended: "bg-red-950 text-red-400 border-red-900",
  soft_claimed: "bg-amber-950 text-amber-400 border-amber-900",
};

export function ListingsTab({ allListings, onRun, onRefresh }: ListingsTabProps) {
  const [listingSearch, setListingSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = allListings.filter((b) => {
    const matchSearch = !listingSearch || b.name?.toLowerCase().includes(listingSearch.toLowerCase());
    const matchPlan = planFilter === "all" || b.plan_tier === planFilter;
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-grow min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name…"
            value={listingSearch}
            onChange={(e) => setListingSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brandRed"
          />
        </div>

        {/* Plan filter */}
        <Select value={planFilter} onValueChange={(val) => setPlanFilter(val || "all")}>
          <SelectTrigger className="w-[120px] bg-slate-900 border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-brandRed">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {PLAN_TIERS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
          <SelectTrigger className="w-[130px] bg-slate-900 border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-brandRed">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="unclaimed">Unclaimed</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="soft_claimed">Soft Claimed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center text-xs text-slate-600 ml-auto">
          {filtered.length} of {allListings.length} listings
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_110px_130px_60px_120px] gap-0 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2.5 border-b border-slate-800 bg-slate-800/80">
            <span>Business</span>
            <span className="text-center">Status</span>
            <span className="text-center">Plan</span>
            <span className="text-center">★</span>
            <span className="text-center">Actions</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-600 italic">No listings match your filters.</div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[560px] overflow-y-auto">
              {filtered.map((b) => (
                <div key={b.id} className="grid grid-cols-[1fr_110px_130px_60px_120px] items-center gap-0 px-4 py-3 hover:bg-slate-800/40 transition">
                  {/* Business info */}
                  <div className="pr-4 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs font-bold text-white truncate">{b.name}</p>
                      {b.slug && (
                        <a
                          href={`/listings/${b.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-slate-400 flex-shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 truncate">
                      {b.category?.name ?? "—"} · {b.city?.name ?? "—"}
                      {b.verification_level && (
                        <span className="ml-1 text-slate-700">· {b.verification_level}</span>
                      )}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex justify-center px-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${statusColors[b.status] ?? "bg-slate-800 text-slate-500 border-slate-700"}`}>
                      {b.status}
                    </span>
                  </div>

                  {/* Plan selector */}
                  <div className="flex justify-center px-2">
                    <Select 
                      value={b.plan_tier} 
                      onValueChange={async (val) => {
                        await onRun(() => updateBusinessAdminAction(b.id, { plan_tier: val }));
                        onRefresh();
                      }}
                    >
                      <SelectTrigger className={`text-[10px] font-bold border rounded px-2 py-1 h-auto cursor-pointer focus:ring-0 focus:ring-offset-0 w-full max-w-[110px] ${planColors[b.plan_tier] ?? "text-slate-400 bg-slate-800 border-slate-700"}`}>
                        <SelectValue placeholder="Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_TIERS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Featured toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={async () => {
                        await onRun(() => updateBusinessAdminAction(b.id, { is_featured: !b.is_featured }));
                        onRefresh();
                      }}
                      className={`p-1.5 rounded-lg border transition ${
                        b.is_featured
                          ? "bg-amber-950 border-amber-900 text-amber-400"
                          : "bg-slate-800 border-slate-700 text-slate-600 hover:text-slate-300"
                      }`}
                      title={b.is_featured ? "Remove featured" : "Set featured"}
                    >
                      <Star className={`h-3.5 w-3.5 ${b.is_featured ? "fill-amber-400" : ""}`} />
                    </button>
                  </div>

                  {/* Suspend / Restore */}
                  <div className="flex justify-center">
                    <button
                      onClick={async () => {
                        const newStatus = b.status === "suspended" ? "claimed" : "suspended";
                        await onRun(() => updateBusinessAdminAction(b.id, { status: newStatus }));
                        onRefresh();
                      }}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded border transition ${
                        b.status === "suspended"
                          ? "bg-emerald-950 border-emerald-900 text-emerald-400 hover:bg-emerald-900"
                          : "bg-slate-800 border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-900"
                      }`}
                    >
                      {b.status === "suspended" ? "Restore" : "Suspend"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
