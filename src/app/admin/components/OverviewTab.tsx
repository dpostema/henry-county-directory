"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { LayoutDashboard, ChevronRight, TrendingUp, Users, Building2, DollarSign } from "lucide-react";

interface OverviewTabProps {
  kpis: { listings: number; claimed: number; activeSubs: number; totalReferrals: number };
  analyticsEvents: any[];
  navBadges: Record<string, number>;
  onSwitchTab: (tab: string) => void;
}

export function OverviewTab({ kpis, analyticsEvents, navBadges, onSwitchTab }: OverviewTabProps) {
  const claimRate = kpis.listings > 0 ? Math.round((kpis.claimed / kpis.listings) * 100) : 0;

  const kpiCards = [
    {
      label: "Total Listings",
      value: kpis.listings,
      sub: `${kpis.claimed} claimed · ${kpis.listings - kpis.claimed} unclaimed`,
      color: "text-slate-900",
      icon: Building2,
      accent: "border-slate-100",
    },
    {
      label: "Claim Rate",
      value: `${claimRate}%`,
      sub: `${kpis.claimed} verified owners`,
      color: "text-emerald-600",
      icon: Users,
      accent: "border-emerald-100",
    },
    {
      label: "Active Subscriptions",
      value: kpis.activeSubs,
      sub: "paid plan holders",
      color: "text-[#E8505B]",
      icon: DollarSign,
      accent: "border-red-100",
    },
    {
      label: "Total Referrals",
      value: kpis.totalReferrals,
      sub: "all-time invites",
      color: "text-blue-600",
      icon: TrendingUp,
      accent: "border-blue-100",
    },
  ];

  const quickActions = [
    { tab: "duplicates", label: "Duplicate Flags", badge: navBadges.duplicates, urgent: true },
    { tab: "claims", label: "Claim Queue", badge: navBadges.claims, urgent: true },
    { tab: "moderation", label: "Moderation", badge: 0, urgent: false },
    { tab: "featured", label: "Featured Slots", badge: 0, urgent: false },
    { tab: "auditlog", label: "Audit Log", badge: 0, urgent: false },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-white border ${kpi.accent} rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{kpi.label}</span>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <span className={`text-3xl font-black font-heading ${kpi.color} block`}>{kpi.value}</span>
              <span className="text-[10px] text-slate-400 block mt-1">{kpi.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Claim Rate Progress Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <LayoutDashboard className="h-4 w-4 text-[#E8505B]" />
            <span>Platform Health Metrics</span>
          </h2>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">{claimRate}% claimed</span>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
              <span>Listing Claim Rate</span>
              <span className="font-bold text-slate-800">{kpis.claimed} / {kpis.listings}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${claimRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
              <span>Monetization Conversion Rate</span>
              <span className="font-bold text-slate-800">{kpis.activeSubs} / {kpis.claimed} claimed</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E8505B] rounded-full transition-all duration-700"
                style={{ width: kpis.claimed > 0 ? `${Math.round((kpis.activeSubs / kpis.claimed) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent Events Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Action Shortlist</h2>
          <div className="space-y-2">
            {quickActions.map((qa) => (
              <button
                key={qa.tab}
                onClick={() => onSwitchTab(qa.tab)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 text-xs font-bold transition group"
              >
                <div className="flex items-center space-x-2">
                  <span>{qa.label}</span>
                  {qa.badge > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${qa.urgent ? "bg-[#E8505B] text-white" : "bg-slate-200 text-slate-700"}`}>
                      {qa.badge}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#E8505B] group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Live Feed */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live System Feed</h2>
            <span className="text-[10px] text-slate-400 font-medium">Last 5 events</span>
          </div>
          <div className="space-y-2.5">
            {analyticsEvents.slice(0, 5).map((ev, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-mono text-slate-700 text-[11px] font-semibold">{ev.event_type}</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(ev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            {analyticsEvents.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">No analytics events recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
