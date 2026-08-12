/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { hasFeatureAccess } from "@/utils/featureGate";

interface DashboardOverviewProps {
  activeBusiness: any;
  leads: any[];
  reviews: any[];
  qnas: any[];
  bookings: any[];
  totalEngagement: number;
  percentageChange: number;
  chartData: any[];
  setActiveTab: (tab: "overview" | "edit" | "leads" | "reviews" | "qna" | "settings" | "billing" | "bookings" | "marketing") => void;
}

export default function DashboardOverview({
  activeBusiness,
  leads,
  reviews,
  qnas,
  bookings,
  totalEngagement,
  percentageChange,
  chartData,
  setActiveTab,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Overview</h2>
          <p className="text-xs text-slate-500 font-medium">Activity summary and performance metrics</p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-red-50 text-[#E8505B] border border-red-100">
          {activeBusiness?.plan_tier || "Standard"} Tier
        </span>
      </div>

      {/* Metric & Bar Chart Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Listing Traffic & Engagement</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                {totalEngagement}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                percentageChange >= 0 
                  ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                  : "text-red-600 bg-red-50 border-red-100"
              }`}>
                <span>{percentageChange >= 0 ? "↗" : "↘"}</span> {percentageChange > 0 ? "+" : ""}{percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-medium block">Active Leads</span>
            <span className="text-lg font-bold text-[#E8505B]">{leads.length} inquiries</span>
          </div>
        </div>

        {/* Bar Chart Visual */}
        <div className="pt-4 border-t border-slate-100">
          <div className="h-36 flex items-end justify-between gap-2 px-2 pb-2">
            {chartData.map((dp, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div 
                  className="w-full max-w-[28px] bg-[#E8505B] hover:bg-[#CF3641] rounded-t-md transition-all duration-300 relative shadow-xs"
                  style={{ height: dp.height }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold">
                    {dp.count} {dp.count === 1 ? 'Action' : 'Actions'}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                  {dp.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity List Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 font-heading">Recent Listing Activity</h3>
          <button onClick={() => setActiveTab("leads")} className="text-xs font-bold text-[#E8505B] hover:underline">
            View All Inbox
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {leads.slice(0, 4).map((lead) => (
            <div key={lead.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-base flex-shrink-0">
                  ↗
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-heading">{lead.sender_name || "New Business Inquiry"}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-[200px]">{lead.sender_email || lead.message}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900">
                  {new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="block text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                  {lead.status}
                </span>
              </div>
            </div>
          ))}

          {qnas.filter(q => !q.answer).slice(0, 2).map((q) => (
            <div key={q.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E8505B] border border-red-100 flex items-center justify-center font-bold text-base flex-shrink-0">
                  ↘
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-heading">Question Pending Answer</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-[200px]">{q.question}</p>
                </div>
              </div>
              <div className="text-right">
                <button onClick={() => setActiveTab("qna")} className="text-[10px] font-bold text-[#E8505B] bg-red-50 px-2.5 py-1 rounded-full border border-red-100 hover:bg-red-100">
                  Answer
                </button>
              </div>
            </div>
          ))}

          {leads.length === 0 && qnas.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              No recent activity recorded yet. Customer leads will appear here automatically.
            </div>
          )}
        </div>
      </div>

      {/* Status Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 font-heading mb-3">
          Listing Status & Details
        </h3>
        <div className="text-xs leading-relaxed space-y-2 font-light text-slate-600">
          <p>
            <strong>Business ID:</strong> <span className="font-mono text-slate-800">{activeBusiness?.id}</span>
          </p>
          <p>
            <strong>Verification level:</strong>{" "}
            <span className="font-semibold text-emerald-600 uppercase">
              {activeBusiness?.verification_level}
            </span>
          </p>
          <p>
            <strong>Plan Tier:</strong>{" "}
            <span className="font-semibold text-[#E8505B] uppercase">
              {activeBusiness?.plan_tier}
            </span>
          </p>
          <p>
            <strong>Featured status:</strong>{" "}
            <span>{activeBusiness?.is_featured ? "Featured Placement Enabled" : "Standard Placement"}</span>
          </p>
        </div>
      </div>

      {/* Competitor Category Insights */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Competitor Category Insights
          </h3>
          <span className="text-[9px] font-bold text-[#E8505B] uppercase tracking-wider bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
            Triage Statistics
          </span>
        </div>

        {!hasFeatureAccess(activeBusiness?.plan_tier, "competitor_benchmarks") ? (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2 relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#E8505B] uppercase tracking-wider block">
                Unlock Benchmark Comparisons
              </span>
              <p className="text-xs text-slate-500 font-light max-w-md mx-auto leading-relaxed">
                Compare your listing performance metrics (ratings, leads conversion, search visibility) with category averages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl mt-2 transition"
            >
              Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block">Rating average</span>
              <div className="text-sm font-bold text-slate-900 flex items-center justify-center space-x-2">
                <span className="text-base text-emerald-600">{activeBusiness?.rating_avg?.toFixed(1) || "0.0"}</span>
                <span className="text-slate-400 font-light">Stars</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block">Total Inquiries</span>
              <div className="text-sm font-bold text-slate-900 flex items-center justify-center space-x-2">
                <span className="text-base text-emerald-600">{leads.length}</span>
                <span className="text-slate-400 font-light">Leads</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block">Total Reviews</span>
              <div className="text-sm font-bold text-slate-900 flex items-center justify-center space-x-2">
                <span className="text-base text-emerald-600">{reviews.length}</span>
                <span className="text-slate-400 font-light">Reviews</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
