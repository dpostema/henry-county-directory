"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, ArrowRightLeft, X, ExternalLink, Phone, MapPin, Tag, CalendarDays } from "lucide-react";
import { mergeListingsAction, dismissDuplicateAction } from "../actions";

interface DuplicatesTabProps {
  duplicates: any[];
  onRun: (fn: () => Promise<any>, onSuccess?: () => void) => Promise<void>;
  onRefresh: () => void;
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const cls =
    pct >= 80
      ? "text-red-400 bg-red-950 border-red-900"
      : pct >= 60
      ? "text-amber-400 bg-amber-950 border-amber-900"
      : "text-emerald-400 bg-emerald-950 border-emerald-900";
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${cls}`}>
      {pct}% match
    </span>
  );
}

function BusinessCard({ biz, label }: { biz: any; label: "A" | "B" }) {
  const labelColor = label === "A" ? "bg-blue-900 text-blue-300" : "bg-purple-900 text-purple-300";
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2.5 flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${labelColor}`}>
              {label}
            </span>
            <span className="text-xs font-bold text-white truncate">{biz?.name ?? "—"}</span>
          </div>
        </div>
        {biz?.slug && (
          <a
            href={`/listings/${biz.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition"
            title="View listing"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <div className="space-y-1.5 text-[11px]">
        {biz?.address && (
          <div className="flex items-start space-x-1.5 text-slate-400">
            <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5 text-slate-600" />
            <span>{biz.address}</span>
          </div>
        )}
        {biz?.phone && (
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Phone className="h-3 w-3 flex-shrink-0 text-slate-600" />
            <span>{biz.phone}</span>
          </div>
        )}
        {biz?.category?.name && (
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Tag className="h-3 w-3 flex-shrink-0 text-slate-600" />
            <span>{biz.category.name}</span>
            {biz.city?.name && <span className="text-slate-600">· {biz.city.name}</span>}
          </div>
        )}
        {biz?.created_at && (
          <div className="flex items-center space-x-1.5 text-slate-500">
            <CalendarDays className="h-3 w-3 flex-shrink-0 text-slate-600" />
            <span>Added {new Date(biz.created_at).toLocaleDateString()}</span>
          </div>
        )}
        {biz?.status && (
          <span
            className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
              biz.status === "claimed"
                ? "bg-emerald-950 border-emerald-900 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
          >
            {biz.status}
          </span>
        )}
      </div>
    </div>
  );
}

export function DuplicatesTab({ duplicates, onRun, onRefresh }: DuplicatesTabProps) {
  if (duplicates.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
        <AlertTriangle className="h-10 w-10 text-slate-700 mx-auto" />
        <p className="text-sm font-bold text-slate-600">No duplicate flags pending</p>
        <p className="text-xs text-slate-700">The import pipeline flags potential duplicates automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span>Duplicate Flags — {duplicates.length} Pending</span>
        </h2>
        <p className="text-[10px] text-slate-600">Review each pair and choose which to keep or dismiss.</p>
      </div>

      <div className="space-y-4">
        {duplicates.map((dup) => (
          <div key={dup.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <ConfidenceBadge score={dup.confidence_score} />
              <span className="text-[10px] text-slate-600">
                Flag ID: <span className="font-mono">{dup.id?.slice(0, 8)}</span>
              </span>
            </div>

            {/* Side-by-side comparison */}
            <div className="flex gap-3 items-stretch">
              <BusinessCard biz={dup.business_a} label="A" />
              <div className="flex items-center flex-shrink-0">
                <div className="w-px h-full bg-slate-700" />
                <div className="bg-slate-800 border border-slate-700 rounded-full p-1.5 -mx-3.5 z-10">
                  <ArrowRightLeft className="h-3 w-3 text-slate-500" />
                </div>
                <div className="w-px h-full bg-slate-700" />
              </div>
              <BusinessCard biz={dup.business_b} label="B" />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold pt-1 border-t border-slate-800">
              <button
                onClick={() =>
                  onRun(() => mergeListingsAction(dup.business_a?.id, dup.business_b?.id), onRefresh)
                }
                className="flex items-center space-x-1.5 bg-blue-950/50 hover:bg-blue-950 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-900 transition"
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>Keep A, Remove B</span>
              </button>
              <button
                onClick={() =>
                  onRun(() => mergeListingsAction(dup.business_b?.id, dup.business_a?.id), onRefresh)
                }
                className="flex items-center space-x-1.5 bg-purple-950/50 hover:bg-purple-950 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-900 transition"
              >
                <ArrowRightLeft className="h-3 w-3 scale-x-[-1]" />
                <span>Keep B, Remove A</span>
              </button>
              <button
                onClick={() => onRun(() => dismissDuplicateAction(dup.id), onRefresh)}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700 transition ml-auto"
              >
                <X className="h-3 w-3" />
                <span>Not a Duplicate — Dismiss</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
