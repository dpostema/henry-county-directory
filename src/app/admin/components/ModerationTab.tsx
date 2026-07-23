"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, Trash2, ShieldCheck, ShieldOff, Star } from "lucide-react";
import {
  deleteReviewAction,
  flagReviewAction,
  approveReviewAction,
  deleteQnaAction,
  flagQnaAction,
  flagLeadAction,
} from "../actions";
import { useState } from "react";

interface ModerationTabProps {
  modReviews: any[];
  modQna: any[];
  modLeads: any[];
  onRun: (fn: () => Promise<any>, onSuccess?: () => void) => Promise<void>;
  onRefresh: () => void;
}

type ModSubTab = "reviews" | "qna" | "leads";

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-700"}`}
        />
      ))}
    </div>
  );
}

function RatingHistogram({ reviews }: { reviews: any[] }) {
  const counts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3">Rating Distribution</p>
      {counts.map(({ rating, count }) => (
        <div key={rating} className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 w-12 flex-shrink-0">
            <span className="text-slate-400 font-bold">{rating}</span>
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex-grow h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-slate-500 w-6 text-right flex-shrink-0">{count}</span>
        </div>
      ))}
    </div>
  );
}

function AiTagSummary({ leads }: { leads: any[] }) {
  const tagCounts: Record<string, number> = {};
  leads.forEach((l) => {
    if (l.ai_tag) tagCounts[l.ai_tag] = (tagCounts[l.ai_tag] || 0) + 1;
  });
  const tags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a);
  if (tags.length === 0) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3">AI Tag Summary</p>
      <div className="flex flex-wrap gap-2">
        {tags.map(([tag, count]) => (
          <span key={tag} className="flex items-center space-x-1.5 text-[10px] bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600">
            <span>{tag}</span>
            <span className="bg-slate-600 text-white font-bold px-1.5 py-0.5 rounded-full text-[8px]">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function ModerationTab({ modReviews, modQna, modLeads, onRun, onRefresh }: ModerationTabProps) {
  const [modSubTab, setModSubTab] = useState<ModSubTab>("reviews");

  return (
    <div className="space-y-4">
      {/* Sub-tab selector */}
      <div className="flex space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {(["reviews", "qna", "leads"] as const).map((sub) => (
          <button
            key={sub}
            onClick={() => setModSubTab(sub)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
              modSubTab === sub ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {sub === "reviews"
              ? `Reviews (${modReviews.length})`
              : sub === "qna"
              ? `Q&A (${modQna.length})`
              : `Leads / Spam (${modLeads.length})`}
          </button>
        ))}
      </div>

      {/* ── Reviews ──────────────────────────────────────────────────────────── */}
      {modSubTab === "reviews" && (
        <div className="space-y-4">
          {modReviews.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <RatingHistogram reviews={modReviews} />
              </div>
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 max-h-[320px] overflow-y-auto">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Flagged &amp; Recent</p>
                {modReviews.filter((r) => r.status === "flagged").length === 0 && (
                  <p className="text-xs text-slate-600 italic">No flagged reviews.</p>
                )}
                {modReviews
                  .filter((r) => r.status === "flagged")
                  .map((rev) => (
                    <div key={rev.id} className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 flex justify-between items-start gap-3">
                      <div className="space-y-1 flex-grow text-xs">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className="font-bold text-white">{rev.author?.full_name ?? "Anonymous"}</span>
                          <RatingStars rating={rev.rating} />
                          <span className="text-[10px] text-slate-500">→ {rev.business?.name}</span>
                          <span className="text-[9px] font-bold bg-red-950 border border-red-900 text-red-400 px-1.5 py-0.5 rounded uppercase">Flagged</span>
                        </div>
                        {rev.comment && (
                          <p className="text-slate-400 font-light text-[11px] leading-relaxed italic">&ldquo;{rev.comment}&rdquo;</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col space-y-1">
                        <button
                          onClick={() => onRun(() => approveReviewAction(rev.id), onRefresh)}
                          className="p-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded-lg border border-emerald-900 transition"
                          title="Approve review"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onRun(() => deleteReviewAction(rev.id), onRefresh)}
                          className="p-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg border border-red-900 transition"
                          title="Delete review"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">All Recent Reviews</h2>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {modReviews.length === 0 && (
                <p className="text-xs text-slate-600 italic text-center py-8">No reviews yet.</p>
              )}
              {modReviews.map((rev) => (
                <div key={rev.id} className={`border rounded-lg p-3 flex justify-between items-start gap-3 ${
                  rev.status === "flagged" ? "bg-red-950/10 border-red-900/30" : "bg-slate-800 border-slate-700"
                }`}>
                  <div className="space-y-1 flex-grow text-xs">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="font-bold text-white">{rev.author?.full_name ?? "Anonymous"}</span>
                      <RatingStars rating={rev.rating} />
                      <span className="text-[10px] text-slate-500">→ {rev.business?.name}</span>
                      {rev.status === "flagged" && (
                        <span className="text-[9px] font-bold bg-red-950 border border-red-900 text-red-400 px-1.5 py-0.5 rounded uppercase">Flagged</span>
                      )}
                      {rev.status === "approved" && (
                        <span className="text-[9px] font-bold bg-emerald-950 border border-emerald-900 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Approved</span>
                      )}
                    </div>
                    {rev.comment && (
                      <p className="text-slate-400 font-light text-[11px] leading-relaxed italic">&ldquo;{rev.comment}&rdquo;</p>
                    )}
                    <span className="text-[10px] text-slate-600">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex-shrink-0 flex flex-col space-y-1">
                    {rev.status !== "flagged" && (
                      <button
                        onClick={() => onRun(() => flagReviewAction(rev.id), onRefresh)}
                        className="p-1.5 bg-amber-950 hover:bg-amber-900 text-amber-400 rounded-lg border border-amber-900 transition"
                        title="Flag as spam"
                      >
                        <ShieldOff className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {rev.status === "flagged" && (
                      <button
                        onClick={() => onRun(() => approveReviewAction(rev.id), onRefresh)}
                        className="p-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded-lg border border-emerald-900 transition"
                        title="Approve review"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onRun(() => deleteReviewAction(rev.id), onRefresh)}
                      className="p-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg border border-red-900 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Q&A ──────────────────────────────────────────────────────────────── */}
      {modSubTab === "qna" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Recent Q&amp;A</h2>
          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {modQna.length === 0 && (
              <p className="text-xs text-slate-600 italic text-center py-8">No Q&amp;A entries yet.</p>
            )}
            {modQna.map((q) => (
              <div key={q.id} className={`border rounded-lg p-3 flex justify-between items-start gap-3 ${
                q.status === "flagged" ? "bg-red-950/10 border-red-900/30" : "bg-slate-800 border-slate-700"
              }`}>
                <div className="space-y-1 flex-grow text-xs">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <p className="font-bold text-white">{q.question}</p>
                    {q.status === "flagged" && (
                      <span className="text-[9px] font-bold bg-red-950 border border-red-900 text-red-400 px-1.5 py-0.5 rounded uppercase">Flagged</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {q.visitor?.full_name ?? "Visitor"} → {q.business?.name}
                  </span>
                  {q.answer && <p className="text-slate-400 italic text-[11px]">A: {q.answer}</p>}
                </div>
                <div className="flex-shrink-0 flex flex-col space-y-1">
                  {q.status !== "flagged" && (
                    <button
                      onClick={() => onRun(() => flagQnaAction(q.id), onRefresh)}
                      className="p-1.5 bg-amber-950 hover:bg-amber-900 text-amber-400 rounded-lg border border-amber-900 transition"
                      title="Flag as spam"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onRun(() => deleteQnaAction(q.id), onRefresh)}
                    className="p-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg border border-red-900 transition"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Leads / Spam ──────────────────────────────────────────────────────── */}
      {modSubTab === "leads" && (
        <div className="space-y-4">
          <AiTagSummary leads={modLeads} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Recent Leads</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {modLeads.length === 0 && (
                <p className="text-xs text-slate-600 italic text-center py-8">No leads to moderate.</p>
              )}
              {modLeads.map((lead) => (
                <div key={lead.id} className={`border rounded-lg p-3 flex justify-between items-start gap-3 ${
                  lead.status === "flagged" ? "bg-red-950/10 border-red-900/30" : "bg-slate-800 border-slate-700"
                }`}>
                  <div className="space-y-1 flex-grow text-xs">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="font-bold text-white">{lead.name}</span>
                      {lead.status === "flagged" && (
                        <span className="text-[9px] bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded font-bold uppercase">Flagged</span>
                      )}
                      {lead.ai_tag && (
                        <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">{lead.ai_tag}</span>
                      )}
                    </div>
                    <p className="text-slate-400 italic text-[11px]">&ldquo;{lead.message?.slice(0, 120)}&rdquo;</p>
                    <span className="text-[10px] text-slate-500">{lead.email} → {lead.business?.name}</span>
                  </div>
                  {lead.status !== "flagged" && (
                    <button
                      onClick={() => onRun(() => flagLeadAction(lead.id), onRefresh)}
                      className="flex-shrink-0 p-1.5 bg-amber-950 hover:bg-amber-900 text-amber-400 rounded-lg border border-amber-900 transition"
                      title="Flag as spam"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
