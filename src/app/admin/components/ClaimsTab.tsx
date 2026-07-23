"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { UserCheck, Check, X, ExternalLink, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { approveClaimAction, rejectClaimAction } from "../actions";

interface ClaimsTabProps {
  claimRequests: any[];
  onRun: (fn: () => Promise<any>, onSuccess?: () => void) => Promise<void>;
  onRefresh: () => void;
}

type ClaimFilter = "pending" | "approved" | "rejected" | "all";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

function ClaimCard({
  req,
  onRun,
  onRefresh,
}: {
  req: any;
  onRun: ClaimsTabProps["onRun"];
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending = req.status === "pending";

  return (
    <div className={`bg-slate-800 border rounded-xl overflow-hidden transition ${
      isPending ? "border-slate-700" : req.status === "approved" ? "border-emerald-900/50" : "border-red-900/30"
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{req.business?.name ?? "Unknown Business"}</p>
            <p className="text-[10px] text-slate-500 truncate">{req.full_name} · {req.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="flex items-center space-x-1 text-[10px] text-slate-600">
            <Clock className="h-3 w-3" />
            <span>{timeAgo(req.created_at)}</span>
          </div>
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
              req.status === "approved"
                ? "bg-emerald-950 border-emerald-900 text-emerald-400"
                : req.status === "rejected"
                ? "bg-red-950 border-red-900 text-red-400"
                : "bg-amber-950 border-amber-900 text-amber-400"
            }`}
          >
            {req.status}
          </span>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-slate-500 hover:text-slate-300 transition"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-700 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="bg-slate-900 rounded-lg p-3 space-y-1.5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Claimant</p>
              <p className="text-slate-200">{req.full_name}</p>
              <p className="text-slate-400">{req.email}</p>
              {req.phone && <p className="text-slate-400">{req.phone}</p>}
            </div>
            <div className="bg-slate-900 rounded-lg p-3 space-y-1.5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Business</p>
              <p className="text-slate-200">{req.business?.name}</p>
              {req.business?.slug && (
                <a
                  href={`/listings/${req.business.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-brandRed hover:underline"
                >
                  <span>View Listing</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {req.notes && (
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Supporting Notes / Proof</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">{req.notes}</p>
            </div>
          )}

          {isPending && (
            <div className="flex space-x-2 text-[10px] font-bold">
              <button
                onClick={() => onRun(() => approveClaimAction(req.id, req.business_id), onRefresh)}
                className="flex items-center space-x-1.5 bg-emerald-900/50 hover:bg-emerald-900 text-emerald-300 px-4 py-2 rounded-lg border border-emerald-800 transition"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Approve &amp; Verify</span>
              </button>
              <button
                onClick={() => onRun(() => rejectClaimAction(req.id, req.business_id), onRefresh)}
                className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 px-4 py-2 rounded-lg border border-slate-600 transition"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reject &amp; Reset</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ClaimsTab({ claimRequests, onRun, onRefresh }: ClaimsTabProps) {
  const [filter, setFilter] = useState<ClaimFilter>("pending");

  const filtered =
    filter === "all" ? claimRequests : claimRequests.filter((r) => r.status === filter);

  const counts = {
    pending: claimRequests.filter((r) => r.status === "pending").length,
    approved: claimRequests.filter((r) => r.status === "approved").length,
    rejected: claimRequests.filter((r) => r.status === "rejected").length,
    all: claimRequests.length,
  };

  const filters: ClaimFilter[] = ["pending", "approved", "rejected", "all"];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition capitalize ${
              filter === f ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-2">
          <UserCheck className="h-10 w-10 text-slate-700 mx-auto" />
          <p className="text-sm font-bold text-slate-600">No {filter} claim requests</p>
          <p className="text-xs text-slate-700">Claim requests appear here when owners fail OTP verification.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <ClaimCard key={req.id} req={req} onRun={onRun} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}
