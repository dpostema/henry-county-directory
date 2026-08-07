"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { siteConfig } from "@/config/site";
import {
  approveClaimAction,
  rejectClaimAction,
  dismissDuplicateAction,
  mergeListingsAction,
  deleteReviewAction,
  deleteQnaAction,
  flagLeadAction,
  updateBusinessAdminAction,
  createCategoryAction,
  deleteCategoryAction,
  createCityAction,
  deleteCityAction,
  createBestOfListAction,
  addBestOfListItemAction,
  removeBestOfListItemAction,
} from "./actions";
import {
  Shield,
  Upload,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  Building2,
  Tag,
  Star,
  ListOrdered,
  Gift,
  BarChart2,
  ScrollText,
  LayoutDashboard,
  RefreshCw,
  Check,
  X,
  Trash2,
  Plus,
  Search,
  ArrowRightLeft,
  ChevronRight,
  CheckCircle,
  LogOut,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTab =
  | "overview"
  | "csv"
  | "duplicates"
  | "claims"
  | "moderation"
  | "listings"
  | "taxonomy"
  | "featured"
  | "bestof"
  | "referrals"
  | "analytics"
  | "auditlog";

// ─── Constants ────────────────────────────────────────────────────────────────

const SAMPLE_CSV = `name,address,phone,email,website,description,category,city
McDonough Dental Care,125 Sabot Way McDonough GA,770-555-0210,info@mcdonoughdental.com,https://mcdonoughdental.com,Professional dental clinic offering standard checkups scaling implants and family oral care.,Medicals,McDonough
Stockbridge Auto Repair,480 North Henry Blvd Stockbridge GA,770-555-0220,service@stockbridgeauto.com,https://stockbridgeauto.com,Full service automotive workshop specializing in engine diagnostics brake services and tire installations.,Automotive,Stockbridge
Hampton Coffee Depot,12 Cherry St Hampton GA,770-555-0230,hello@hamptoncoffee.com,https://hamptoncoffee.com,Cozy coffee shop offering hand-roasted coffee blends house-made pastries and quiet workspaces.,Foods,Hampton`;

const INITIAL_AB_TESTS = [
  { id: "featured_placement_v2", name: "Featured badge position: Above name vs. Top-right corner", enabled: false },
  { id: "cta_color_red_vs_dark", name: "CTA button: Accent red vs. Slate-900 dark", enabled: false },
  { id: "search_bar_hero_pill", name: "Hero search: Split pill vs. Single unified bar", enabled: true },
  { id: "pricing_monthly_first", name: "Pricing page: Monthly plan shown first vs. Annual first", enabled: false },
];

// ─── Sidebar Nav Config ───────────────────────────────────────────────────────

const NAV_ITEMS: { label: string; tab: AdminTab; icon: any; badgeKey?: string }[] = [
  { label: "Overview", tab: "overview", icon: LayoutDashboard },
  { label: "CSV Import", tab: "csv", icon: Upload },
  { label: "Duplicates", tab: "duplicates", icon: AlertTriangle, badgeKey: "duplicates" },
  { label: "Claims Queue", tab: "claims", icon: UserCheck, badgeKey: "claims" },
  { label: "Moderation", tab: "moderation", icon: ShieldAlert },
  { label: "Listings", tab: "listings", icon: Building2 },
  { label: "Categories & Cities", tab: "taxonomy", icon: Tag },
  { label: "Featured Slots", tab: "featured", icon: Star },
  { label: "Best-of Lists", tab: "bestof", icon: ListOrdered },
  { label: "Referrals", tab: "referrals", icon: Gift },
  { label: "Analytics", tab: "analytics", icon: BarChart2 },
  { label: "Audit Log", tab: "auditlog", icon: ScrollText },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const supabase = createClient();

  // Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Badge counts for nav
  const [navBadges, setNavBadges] = useState<Record<string, number>>({ duplicates: 0, claims: 0 });

  // ── CSV tab state ─────────────────────────────────────────────────────────
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [importLoading, setImportLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<any>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [ghlLoading, setGhlLoading] = useState(false);
  const [ghlStatus, setGhlStatus] = useState<any>(null);

  // ── Duplicates tab state ──────────────────────────────────────────────────
  const [duplicates, setDuplicates] = useState<any[]>([]);


  // ── Claims tab state ──────────────────────────────────────────────────────
  const [claimRequests, setClaimRequests] = useState<any[]>([]);

  // ── Moderation tab state ──────────────────────────────────────────────────
  const [modReviews, setModReviews] = useState<any[]>([]);
  const [modQna, setModQna] = useState<any[]>([]);
  const [modLeads, setModLeads] = useState<any[]>([]);
  const [modSubTab, setModSubTab] = useState<"reviews" | "qna" | "leads">("reviews");

  // ── Listings tab state ────────────────────────────────────────────────────
  const [allListings, setAllListings] = useState<any[]>([]);
  const [listingSearch, setListingSearch] = useState("");


  // ── Taxonomy tab state ────────────────────────────────────────────────────
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📁");
  const [newCityName, setNewCityName] = useState("");
  const [newCitySlug, setNewCitySlug] = useState("");

  // ── Featured tab state ────────────────────────────────────────────────────
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);

  // ── Best-of tab state ─────────────────────────────────────────────────────
  const [bestOfLists, setBestOfLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListTitle, setNewListTitle] = useState("");
  const [newListSlug, setNewListSlug] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [addItemBusId, setAddItemBusId] = useState("");
  const [addItemRank, setAddItemRank] = useState(1);

  // ── Referrals tab state ───────────────────────────────────────────────────
  const [referrals, setReferrals] = useState<any[]>([]);

  // ── Analytics tab state ───────────────────────────────────────────────────
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [abTests, setAbTests] = useState(INITIAL_AB_TESTS);
  const [kpis, setKpis] = useState({ listings: 0, claimed: 0, activeSubs: 0, totalReferrals: 0 });

  // ── Audit log state ───────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // ─── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles").select("role, email").eq("id", user.id).single();

      if (profile?.role === "admin") {
        setIsAdmin(true);
        setAdminEmail(profile.email || user.email || "");
        await loadNavBadges();
        await loadTabData("overview");
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  // ─── Tab switch loader ──────────────────────────────────────────────────────
  const loadTabData = useCallback(async (tab: AdminTab) => {
    switch (tab) {
      case "overview":     await loadOverview(); break;
      case "csv":          await loadCsvHistory(); break;
      case "duplicates":   await loadDuplicates(); break;
      case "claims":       await loadClaims(); break;
      case "moderation":   await loadModeration(); break;
      case "listings":     await loadListings(); break;
      case "taxonomy":     await loadTaxonomy(); break;
      case "featured":     await loadFeatured(); break;
      case "bestof":       await loadBestOf(); break;
      case "referrals":    await loadReferrals(); break;
      case "analytics":    await loadAnalytics(); break;
      case "auditlog":     await loadAuditLog(); break;
    }
  }, []);

  // ─── Data loaders ──────────────────────────────────────────────────────────

  async function loadNavBadges() {
    const { count: dups } = await supabase.from("duplicate_flags").select("*", { count: "exact", head: true }).eq("status", "pending");
    const { count: claims } = await supabase.from("claim_requests").select("*", { count: "exact", head: true }).eq("status", "pending");
    setNavBadges({ duplicates: dups || 0, claims: claims || 0 });
  }

  async function loadOverview() {
    const { count: listings } = await supabase.from("businesses").select("*", { count: "exact", head: true });
    const { count: claimed } = await supabase.from("businesses").select("*", { count: "exact", head: true }).neq("status", "unclaimed");
    const { count: activeSubs } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active");
    const { count: totalReferrals } = await supabase.from("referrals").select("*", { count: "exact", head: true });
    setKpis({ listings: listings || 0, claimed: claimed || 0, activeSubs: activeSubs || 0, totalReferrals: totalReferrals || 0 });

    const { data: events } = await supabase
      .from("analytics_events").select("event_type, created_at").order("created_at", { ascending: false }).limit(10);
    setAnalyticsEvents(events || []);
  }

  async function loadCsvHistory() {
    const { data } = await supabase
      .from("admin_logs").select("*").ilike("action", "csv%").order("created_at", { ascending: false }).limit(20);
    setImportHistory(data || []);
  }

  async function loadDuplicates() {
    const { data } = await supabase
      .from("duplicate_flags")
      .select(`id, confidence_score, status, business_a:businesses!business_a_id(id, name, slug), business_b:businesses!business_b_id(id, name, slug)`)
      .eq("status", "pending")
      .order("confidence_score", { ascending: false });
    setDuplicates(data || []);
  }

  async function loadClaims() {
    const { data } = await supabase
      .from("claim_requests")
      .select("*, business:businesses(name, slug)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setClaimRequests(data || []);
  }

  async function loadModeration() {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("*, author:profiles(full_name, email), business:businesses(name, slug)")
      .order("created_at", { ascending: false })
      .limit(50);
    setModReviews(reviews || []);

    const { data: qna } = await supabase
      .from("qna")
      .select("*, visitor:profiles(full_name), business:businesses(name, slug)")
      .order("created_at", { ascending: false })
      .limit(50);
    setModQna(qna || []);

    const { data: leads } = await supabase
      .from("leads")
      .select("*, business:businesses(name)")
      .in("status", ["new", "flagged"])
      .order("created_at", { ascending: false })
      .limit(50);
    setModLeads(leads || []);
  }

  async function loadListings() {
    const { data } = await supabase
      .from("businesses")
      .select("id, name, slug, status, plan_tier, is_featured, verification_level, category:categories(name), city:cities(name)")
      .order("created_at", { ascending: false })
      .limit(100);
    setAllListings(data || []);
  }

  async function loadTaxonomy() {
    const { data: cats } = await supabase.from("categories").select("*").order("name");
    setCategories(cats || []);
    const { data: cityData } = await supabase.from("cities").select("*").order("name");
    setCities(cityData || []);
  }

  async function loadFeatured() {
    const { data } = await supabase
      .from("businesses")
      .select("id, name, slug, plan_tier, is_featured, status")
      .or("is_featured.eq.true,plan_tier.in.(featured,pro,enterprise)")
      .order("plan_tier");
    setFeaturedListings(data || []);
  }

  async function loadBestOf() {
    const { data } = await supabase
      .from("best_of_lists")
      .select("*, items:best_of_list_items(id, rank, business:businesses(id, name, slug))")
      .order("created_at", { ascending: false });
    setBestOfLists(data || []);
  }

  async function loadReferrals() {
    const { data } = await supabase
      .from("referrals")
      .select("*, referrer:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);
    setReferrals(data || []);
  }

  async function loadAnalytics() {
    const { data: events } = await supabase
      .from("analytics_events")
      .select("event_type, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setAnalyticsEvents(events || []);

    const { count: listings } = await supabase.from("businesses").select("*", { count: "exact", head: true });
    const { count: claimed } = await supabase.from("businesses").select("*", { count: "exact", head: true }).neq("status", "unclaimed");
    const { count: activeSubs } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active");
    const { count: totalReferrals } = await supabase.from("referrals").select("*", { count: "exact", head: true });
    setKpis({ listings: listings || 0, claimed: claimed || 0, activeSubs: activeSubs || 0, totalReferrals: totalReferrals || 0 });
  }

  async function loadAuditLog() {
    const { data } = await supabase
      .from("admin_logs")
      .select("*, admin:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);
    setAuditLogs(data || []);
  }

  // ─── Event Handlers ─────────────────────────────────────────────────────────

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    setImportLoading(true);
    try {
      const res = await fetch("/api/csv-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      setImportStatus(data);
      await loadNavBadges();
      await loadCsvHistory();
    } catch (err: any) {
      setImportStatus({ error: err.message });
    } finally {
      setImportLoading(false);
    }
  };

  const handleGHLSync = async () => {
    setGhlStatus(null);
    setGhlLoading(true);
    try {
      const res = await fetch("/api/ghl-sync", { method: "POST" });
      setGhlStatus(await res.json());
    } catch (err: any) {
      setGhlStatus({ error: err.message });
    } finally {
      setGhlLoading(false);
    }
  };

  const run = async (fn: () => Promise<any>, onSuccess?: () => void) => {
    const res = await fn();
    if (res?.error) { alert(res.error); return; }
    if (res?.success) alert(res.success);
    await loadNavBadges();
    if (onSuccess) onSuccess();
  };

  // Derived: analytics counts
  const eventCounts: Record<string, number> = {};
  analyticsEvents.forEach((e) => {
    eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(eventCounts), 1);

  // Derived: filtered listings
  const filteredListings = allListings.filter((b) =>
    !listingSearch || b.name?.toLowerCase().includes(listingSearch.toLowerCase())
  );

  // Selected best-of list
  const selectedList = bestOfLists.find((l) => l.id === selectedListId);

  // ─── Loading / Denied States ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-brandBg-app flex items-center justify-center">
        <div className="text-brandText-light text-sm font-body animate-pulse">Verifying admin credentials…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-brandBg-app flex items-center justify-center font-body">
        <div className="max-w-sm text-center space-y-4 bg-brandBg-card p-8 rounded-2xl border border-brandBorder-light">
          <ShieldAlert className="h-12 w-12 text-brandRed mx-auto" />
          <h1 className="text-xl font-bold text-brandText-dark font-heading">Admin Access Only</h1>
          <p className="text-sm text-brandText-light">Sign in with an admin profile to continue.</p>
          <Link
            href="/auth/login?redirectTo=/admin"
            className="inline-block bg-brandRed hover:bg-brandRed-hover text-brandText-dark text-xs font-bold px-5 py-2.5 rounded-btn shadow-sm transition"
          >
            Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  // ─── Admin Shell ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between font-body text-slate-700">
      {/* Main Grid Workspace */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT SIDEBAR NAV ────────────────────────────────────────────── */}
          <aside className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-6">
            {/* Header / Brand Logo */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-[#E8505B] text-white flex items-center justify-center font-black text-lg shadow-sm shadow-red-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-heading font-black text-base tracking-tight text-slate-900 block leading-tight">
                  {siteConfig.name}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                  Admin Control Panel
                </span>
              </div>
            </div>

            {/* Nav Categories */}
            <div className="space-y-4">
              {[
                {
                  group: "ADMINISTRATION",
                  items: [
                    { label: "Overview", tab: "overview", icon: LayoutDashboard },
                    { label: "Claim Requests", tab: "claims", icon: UserCheck, badgeKey: "claims" },
                    { label: "Moderation Queue", tab: "moderation", icon: ShieldAlert },
                    { label: "Duplicates Manager", tab: "duplicates", icon: AlertTriangle, badgeKey: "duplicates" },
                  ]
                },
                {
                  group: "CONTENT & MANAGEMENT",
                  items: [
                    { label: "Directory Listings", tab: "listings", icon: Building2 },
                    { label: "CSV Importer", tab: "csv", icon: Upload },
                    { label: "Categories & Cities", tab: "taxonomy", icon: Tag },
                    { label: "Featured Placements", tab: "featured", icon: Star },
                    { label: "Best-Of Collections", tab: "bestof", icon: ListOrdered },
                  ]
                },
                {
                  group: "ANALYTICS & SYSTEM",
                  items: [
                    { label: "Referral Network", tab: "referrals", icon: Gift },
                    { label: "Analytics & A/B", tab: "analytics", icon: BarChart2 },
                    { label: "System Audit Log", tab: "auditlog", icon: ScrollText },
                  ]
                }
              ].map((section) => (
                <div key={section.group} className="space-y-1">
                  <div className="px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {section.group}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.tab;
                    const badgeCount = item.badgeKey ? navBadges[item.badgeKey] : 0;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => switchTab(item.tab as AdminTab)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                          isActive
                            ? "bg-[#E8505B] text-white shadow-md shadow-red-500/20"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                          <span>{item.label}</span>
                        </div>
                        {badgeCount > 0 && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isActive ? "bg-white text-[#E8505B]" : "bg-[#E8505B] text-white"
                            }`}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Sidebar Admin User Profile Pill & Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-[#E8505B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {(adminEmail || "A")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    System Administrator
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {adminEmail || "admin@henrycounty.com"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition"
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180 text-slate-400" />
                  <span>Public Site</span>
                </Link>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-[#E8505B] text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ── CENTER MAIN WORKSPACE ────────────────────────────────────────── */}
          <main className="lg:col-span-6 space-y-6">
            {/* Page Header Breadcrumb Card */}
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h1 className="text-lg font-extrabold font-heading text-slate-900 tracking-tight">
                  {NAV_ITEMS.find((n) => n.tab === activeTab)?.label}
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {siteConfig.name} — Internal Control Panel
                </p>
              </div>
              <button
                onClick={() => loadTabData(activeTab)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 transition flex items-center justify-center"
                title="Refresh tab data"
              >
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            </div>

        {/* ── Tab: Overview ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Listings", value: kpis.listings, sub: `${kpis.claimed} claimed`, color: "text-brandText-dark" },
                { label: "Claimed Rate", value: kpis.listings > 0 ? `${Math.round((kpis.claimed / kpis.listings) * 100)}%` : "0%", sub: `${kpis.listings - kpis.claimed} unclaimed`, color: "text-emerald-400" },
                { label: "Active Subscriptions", value: kpis.activeSubs, sub: "paid plan holders", color: "text-brandRed" },
                { label: "Total Referrals", value: kpis.totalReferrals, sub: "all-time invites", color: "text-blue-400" },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-brandBg-card border border-brandBorder-light rounded-xl p-4 text-center">
                  <span className="text-[10px] text-brandText-light uppercase tracking-wider font-bold block mb-1">{kpi.label}</span>
                  <span className={`text-3xl font-black font-heading ${kpi.color} block`}>{kpi.value}</span>
                  <span className="text-[10px] text-brandText-light block mt-1">{kpi.sub}</span>
                </div>
              ))}
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5">
              <h2 className="text-xs font-bold text-brandText-dark mb-4 uppercase tracking-wider">Recent Platform Events</h2>
              {analyticsEvents.length === 0 ? (
                <p className="text-xs text-brandText-light italic text-center py-4">No events recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {analyticsEvents.slice(0, 10).map((ev, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-brandBorder-light last:border-b-0">
                      <span className="font-mono text-brandText-medium bg-slate-50 px-2 py-0.5 rounded text-[10px]">{ev.event_type}</span>
                      <span className="text-brandText-light text-[10px]">{new Date(ev.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5">
              <h2 className="text-xs font-bold text-brandText-dark mb-4 uppercase tracking-wider">Quick Actions</h2>
              <div className="flex flex-wrap gap-2">
                {([["duplicates", "Review Duplicates", navBadges.duplicates], ["claims", "Claim Queue", navBadges.claims], ["moderation", "Moderation"], ["auditlog", "Audit Log"]] as any[]).map(([tab, label, badge]) => (
                  <button
                    key={tab}
                    onClick={() => switchTab(tab as AdminTab)}
                    className="flex items-center space-x-2 text-xs font-bold bg-slate-50 hover:bg-slate-700 text-brandText-dark px-3 py-2 rounded-lg transition"
                  >
                    <span>{label}</span>
                    {badge > 0 && (
                      <span className="text-[9px] bg-brandRed text-brandText-dark px-1.5 py-0.5 rounded-full">{badge}</span>
                    )}
                    <ChevronRight className="h-3 w-3 text-brandText-light" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: CSV Import ─────────────────────────────────────────────── */}
        {activeTab === "csv" && (
          <div className="space-y-6">
            {/* Import Form */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider flex items-center space-x-2">
                <Upload className="h-4 w-4 text-brandRed" />
                <span>CSV Seed Import</span>
              </h2>
              <p className="text-[11px] text-brandText-light">
                Columns: <code className="text-brandText-medium">name, address, phone, email, website, description, category, city</code>
              </p>
              <form onSubmit={handleCSVImport} className="space-y-3">
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-brandBg-app border border-brandBorder-light rounded-lg text-brandText-dark focus:outline-none focus:ring-1 focus:ring-brandRed resize-none"
                />
                <div className="flex justify-between">
                  <button type="button" onClick={() => setCsvText(SAMPLE_CSV)} className="text-xs text-brandText-light hover:text-brandText-medium underline">
                    Reset to sample
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading}
                    className="bg-brandRed hover:bg-brandRed-hover text-brandText-dark text-xs font-bold px-5 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {importLoading ? "Importing…" : "Run Import"}
                  </button>
                </div>
              </form>

              {importStatus && (
                <div className={`p-3 rounded-lg text-xs border ${importStatus.error ? "bg-red-950 border-red-900 text-red-300" : "bg-emerald-950 border-emerald-900 text-emerald-300"}`}>
                  {importStatus.error ? (
                    <p>Error: {importStatus.error}</p>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 font-bold">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Import complete — {importStatus.importedCount} rows inserted, {importStatus.duplicateCount} duplicates flagged</span>
                      </div>
                      {importStatus.errors?.map((e: string, i: number) => (
                        <p key={i} className="text-red-400 text-[10px]">• {e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* GHL Sync */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-3">
              <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-brandRed" />
                <span>GoHighLevel Sync</span>
              </h2>
              <p className="text-[11px] text-brandText-light">Push all unclaimed listings to GHL as cold-lead contacts.</p>
              <button
                onClick={handleGHLSync}
                disabled={ghlLoading}
                className="w-full bg-slate-50 hover:bg-brandRed text-brandText-dark shadow-sm text-xs font-bold py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${ghlLoading ? "animate-spin" : ""}`} />
                <span>{ghlLoading ? "Syncing…" : "Sync Unclaimed Listings to GHL"}</span>
              </button>
              {ghlStatus && (
                <div className={`p-3 rounded-lg text-xs ${ghlStatus.error ? "bg-red-950 text-red-300" : "bg-emerald-950 text-emerald-300"}`}>
                  {ghlStatus.error ? ghlStatus.error : `${ghlStatus.message || "Synced."} (${ghlStatus.syncedCount} contacts)`}
                </div>
              )}
            </div>

            {/* Import History */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-3">
              <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">Import History</h2>
              {importHistory.length === 0 ? (
                <p className="text-xs text-brandText-light italic text-center py-4">No import log entries yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {importHistory.map((log) => (
                    <div key={log.id} className="flex justify-between items-start text-[10px] py-1.5 border-b border-brandBorder-light last:border-b-0">
                      <span className="text-brandText-medium font-mono">{log.action}</span>
                      <span className="text-brandText-light">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Duplicates ─────────────────────────────────────────────── */}
        {activeTab === "duplicates" && (
          <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">
              Duplicate Flags — {duplicates.length} Pending
            </h2>
            {duplicates.length === 0 ? (
              <p className="text-xs text-brandText-light italic text-center py-8">No duplicate flags pending.</p>
            ) : (
              <div className="space-y-3">
                {duplicates.map((dup) => (
                  <div key={dup.id} className="bg-slate-50 border border-brandBorder-light rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-[10px] font-bold text-amber-400">
                            {Math.round(dup.confidence_score * 100)}% confidence match
                          </span>
                        </div>
                        <p className="text-xs font-bold text-brandText-dark">&ldquo;{dup.business_a?.name}&rdquo;</p>
                        <p className="text-[10px] text-brandText-light">vs. &ldquo;{dup.business_b?.name}&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                      <button
                        onClick={() => run(() => mergeListingsAction(dup.business_a?.id, dup.business_b?.id), () => loadDuplicates())}
                        className="flex items-center space-x-1 bg-blue-900/50 hover:bg-blue-900 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-800 transition"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        <span>Merge (keep A, remove B)</span>
                      </button>
                      <button
                        onClick={() => run(() => mergeListingsAction(dup.business_b?.id, dup.business_a?.id), () => loadDuplicates())}
                        className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-brandText-dark px-3 py-1.5 rounded-lg border border-brandBorder-light transition"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        <span>Merge (keep B, remove A)</span>
                      </button>
                      <button
                        onClick={() => run(() => dismissDuplicateAction(dup.id), () => loadDuplicates())}
                        className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-brandText-light px-3 py-1.5 rounded-lg border border-brandBorder-light transition"
                      >
                        <X className="h-3 w-3" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Claims ─────────────────────────────────────────────────── */}
        {activeTab === "claims" && (
          <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">
              Fallback Claim Queue — {claimRequests.length} Pending
            </h2>
            {claimRequests.length === 0 ? (
              <p className="text-xs text-brandText-light italic text-center py-8">No pending claim requests.</p>
            ) : (
              <div className="space-y-3">
                {claimRequests.map((req) => (
                  <div key={req.id} className="bg-slate-50 border border-brandBorder-light rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs font-bold text-brandText-dark">{req.business?.name}</h3>
                        <span className="text-[10px] text-brandText-light">Requester: {req.full_name}</span>
                      </div>
                      <span className="text-[9px] font-bold text-brandRed bg-red-950 border border-red-900 px-2 py-0.5 rounded uppercase">
                        Soft Claimed
                      </span>
                    </div>
                    <div className="text-[10px] text-brandText-light bg-brandBg-card p-2.5 rounded-lg space-y-0.5">
                      <p><strong className="text-brandText-medium">Email:</strong> {req.email}</p>
                      <p><strong className="text-brandText-medium">Phone:</strong> {req.phone}</p>
                      {req.notes && <p><strong className="text-brandText-medium">Proof:</strong> {req.notes}</p>}
                    </div>
                    <div className="flex space-x-2 text-[10px] font-bold">
                      <button
                        onClick={() => run(() => approveClaimAction(req.id, req.business_id), () => loadClaims())}
                        className="flex items-center space-x-1 bg-emerald-900/50 hover:bg-emerald-900 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-800 transition"
                      >
                        <Check className="h-3 w-3" />
                        <span>Approve & Verify</span>
                      </button>
                      <button
                        onClick={() => run(() => rejectClaimAction(req.id, req.business_id), () => loadClaims())}
                        className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-brandText-light px-3 py-1.5 rounded-lg border border-brandBorder-light transition"
                      >
                        <X className="h-3 w-3" />
                        <span>Reject & Reset</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Moderation ─────────────────────────────────────────────── */}
        {activeTab === "moderation" && (
          <div className="space-y-4">
            {/* Sub-tab selector */}
            <div className="flex space-x-1 bg-brandBg-card border border-brandBorder-light rounded-xl p-1 w-fit">
              {(["reviews", "qna", "leads"] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setModSubTab(sub)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                    modSubTab === sub ? "bg-brandRed text-brandText-dark shadow-sm" : "text-brandText-light hover:text-brandText-medium"
                  }`}
                >
                  {sub === "reviews" ? `Reviews (${modReviews.length})` : sub === "qna" ? `Q&A (${modQna.length})` : `Leads / Spam (${modLeads.length})`}
                </button>
              ))}
            </div>

            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-3">
              {/* Reviews sub-tab */}
              {modSubTab === "reviews" && (
                <>
                  <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">Recent Reviews</h2>
                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {modReviews.map((rev) => (
                      <div key={rev.id} className="bg-slate-50 border border-brandBorder-light rounded-lg p-3 flex justify-between items-start gap-3">
                        <div className="space-y-1 flex-grow text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-brandText-dark">{rev.author?.full_name || "Anonymous"}</span>
                            <div className="flex text-amber-400">
                              {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                            </div>
                            <span className="text-[10px] text-brandText-light">→ {rev.business?.name}</span>
                          </div>
                          {rev.comment && (
                            <p className="text-brandText-light font-light text-[11px] leading-relaxed italic">&ldquo;{rev.comment}&rdquo;</p>
                          )}
                          <span className="text-[10px] text-brandText-light">{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => run(() => deleteReviewAction(rev.id), () => loadModeration())}
                          className="flex-shrink-0 p-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg border border-red-900 transition"
                          title="Delete review"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Q&A sub-tab */}
              {modSubTab === "qna" && (
                <>
                  <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">Recent Q&A</h2>
                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {modQna.map((q) => (
                      <div key={q.id} className="bg-slate-50 border border-brandBorder-light rounded-lg p-3 flex justify-between items-start gap-3">
                        <div className="space-y-1 flex-grow text-xs">
                          <p className="font-bold text-brandText-dark">{q.question}</p>
                          <span className="text-[10px] text-brandText-light">
                            {q.visitor?.full_name || "Visitor"} → {q.business?.name}
                          </span>
                          {q.answer && <p className="text-brandText-light italic text-[11px]">A: {q.answer}</p>}
                        </div>
                        <button
                          onClick={() => run(() => deleteQnaAction(q.id), () => loadModeration())}
                          className="flex-shrink-0 p-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg border border-red-900 transition"
                          title="Delete Q&A"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Leads / Spam sub-tab */}
              {modSubTab === "leads" && (
                <>
                  <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">Recent Leads</h2>
                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {modLeads.map((lead) => (
                      <div key={lead.id} className="bg-slate-50 border border-brandBorder-light rounded-lg p-3 flex justify-between items-start gap-3">
                        <div className="space-y-1 flex-grow text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-brandText-dark">{lead.name}</span>
                            {lead.status === "flagged" && (
                              <span className="text-[9px] bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded font-bold uppercase">Flagged</span>
                            )}
                            {lead.ai_tag && (
                              <span className="text-[9px] bg-slate-700 text-brandText-medium px-1.5 py-0.5 rounded">{lead.ai_tag}</span>
                            )}
                          </div>
                          <p className="text-brandText-light italic text-[11px]">&ldquo;{lead.message?.slice(0, 100)}&rdquo;</p>
                          <span className="text-[10px] text-brandText-light">{lead.email} → {lead.business?.name}</span>
                        </div>
                        {lead.status !== "flagged" && (
                          <button
                            onClick={() => run(() => flagLeadAction(lead.id), () => loadModeration())}
                            className="flex-shrink-0 p-1.5 bg-amber-950 hover:bg-amber-900 text-amber-400 rounded-lg border border-amber-900 transition"
                            title="Flag as spam"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Listings ───────────────────────────────────────────────── */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brandText-light" />
              <input
                type="text"
                placeholder="Search listing by name…"
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-brandBg-card border border-brandBorder-light rounded-xl text-xs text-brandText-dark placeholder:text-brandText-light focus:outline-none focus:ring-1 focus:ring-brandRed"
              />
            </div>

            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-[10px] font-bold text-brandText-light uppercase tracking-wider px-4 py-2 border-b border-brandBorder-light bg-slate-50">
                <span>Business</span>
                <span className="text-center px-3">Status</span>
                <span className="text-center px-3">Plan</span>
                <span className="text-center px-3">Featured</span>
                <span className="text-center px-3">Actions</span>
              </div>

              <div className="divide-y divide-slate-800 max-h-[550px] overflow-y-auto">
                {filteredListings.map((b) => (
                  <div key={b.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-0 px-4 py-3 hover:bg-slate-50/50 transition">
                    <div>
                      <p className="text-xs font-bold text-brandText-dark truncate max-w-[220px]">{b.name}</p>
                      <p className="text-[10px] text-brandText-light">{b.category?.name} · {b.city?.name}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded mx-3 uppercase ${
                      b.status === "claimed" ? "bg-emerald-950 text-emerald-400" :
                      b.status === "suspended" ? "bg-red-950 text-red-400" :
                      "bg-slate-50 text-brandText-light"
                    }`}>{b.status}</span>
                    <select
                      value={b.plan_tier}
                      onChange={async (e) => {
                        await run(() => updateBusinessAdminAction(b.id, { plan_tier: e.target.value }));
                        await loadListings();
                      }}
                      className="text-[10px] bg-slate-50 border border-brandBorder-light text-brandText-dark rounded px-2 py-1 mx-3 cursor-pointer focus:outline-none"
                    >
                      {["free", "featured", "pro", "enterprise"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={async () => {
                        await run(() => updateBusinessAdminAction(b.id, { is_featured: !b.is_featured }));
                        await loadListings();
                      }}
                      className={`mx-3 p-1.5 rounded-lg border transition ${
                        b.is_featured
                          ? "bg-amber-950 border-amber-900 text-amber-400"
                          : "bg-slate-50 border-brandBorder-light text-brandText-light hover:text-brandText-medium"
                      }`}
                      title={b.is_featured ? "Remove featured" : "Set featured"}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex space-x-1 mx-3">
                      <button
                        onClick={async () => {
                          const newStatus = b.status === "suspended" ? "claimed" : "suspended";
                          await run(() => updateBusinessAdminAction(b.id, { status: newStatus }));
                          await loadListings();
                        }}
                        className={`text-[9px] font-bold px-2 py-1 rounded border transition ${
                          b.status === "suspended"
                            ? "bg-emerald-950 border-emerald-900 text-emerald-400 hover:bg-emerald-900"
                            : "bg-slate-50 border-brandBorder-light text-brandText-light hover:text-red-400 hover:border-red-900"
                        }`}
                      >
                        {b.status === "suspended" ? "Restore" : "Suspend"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Taxonomy ───────────────────────────────────────────────── */}
        {activeTab === "taxonomy" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">Categories ({categories.length})</h2>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await run(() => createCategoryAction(newCatName, newCatSlug, newCatIcon), () => loadTaxonomy());
                  setNewCatName(""); setNewCatSlug(""); setNewCatIcon("📁");
                }}
                className="flex gap-2"
              >
                <input value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} placeholder="🏷️" className="w-12 bg-slate-50 border border-brandBorder-light text-brandText-dark text-center text-sm rounded-lg focus:outline-none" />
                <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required placeholder="Category name" className="flex-grow bg-slate-50 border border-brandBorder-light text-brandText-dark text-xs rounded-lg px-3 py-2 focus:outline-none" />
                <input value={newCatSlug} onChange={(e) => setNewCatSlug(e.target.value)} required placeholder="slug" className="w-28 bg-slate-50 border border-brandBorder-light text-brandText-dark text-xs rounded-lg px-3 py-2 font-mono focus:outline-none" />
                <button type="submit" className="bg-brandRed hover:bg-brandRed-hover text-brandText-dark p-2 rounded-lg transition">
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between bg-slate-50 border border-brandBorder-light rounded-lg px-3 py-2 text-xs">
                    <span>{cat.icon} <span className="text-brandText-dark font-medium ml-1">{cat.name}</span> <span className="text-brandText-light font-mono ml-1">/{cat.slug}</span></span>
                    <button onClick={() => run(() => deleteCategoryAction(cat.id), () => loadTaxonomy())} className="text-brandText-light hover:text-red-400 transition p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cities */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">Cities ({cities.length})</h2>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await run(() => createCityAction(newCityName, newCitySlug), () => loadTaxonomy());
                  setNewCityName(""); setNewCitySlug("");
                }}
                className="flex gap-2"
              >
                <input value={newCityName} onChange={(e) => setNewCityName(e.target.value)} required placeholder="City name" className="flex-grow bg-slate-50 border border-brandBorder-light text-brandText-dark text-xs rounded-lg px-3 py-2 focus:outline-none" />
                <input value={newCitySlug} onChange={(e) => setNewCitySlug(e.target.value)} required placeholder="slug" className="w-28 bg-slate-50 border border-brandBorder-light text-brandText-dark text-xs rounded-lg px-3 py-2 font-mono focus:outline-none" />
                <button type="submit" className="bg-brandRed hover:bg-brandRed-hover text-brandText-dark p-2 rounded-lg transition">
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {cities.map((city) => (
                  <div key={city.id} className="flex items-center justify-between bg-slate-50 border border-brandBorder-light rounded-lg px-3 py-2 text-xs">
                    <span className="text-brandText-dark font-medium">{city.name}, {city.state} <span className="text-brandText-light font-mono">/{city.slug}</span></span>
                    <button onClick={() => run(() => deleteCityAction(city.id), () => loadTaxonomy())} className="text-brandText-light hover:text-red-400 transition p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Featured Slots ─────────────────────────────────────────── */}
        {activeTab === "featured" && (
          <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">
              Featured & Paid Slots — {featuredListings.length} Active
            </h2>
            <p className="text-[11px] text-brandText-light">Toggle featured placement manually. Plan tier controls access to features; is_featured controls the badge and boosted sort position.</p>
            <div className="space-y-2 max-h-[550px] overflow-y-auto">
              {featuredListings.length === 0 ? (
                <p className="text-xs text-brandText-light italic text-center py-8">No featured or paid listings found.</p>
              ) : (
                featuredListings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between bg-slate-50 border border-brandBorder-light rounded-lg px-4 py-3">
                    <div>
                      <p className="text-xs font-bold text-brandText-dark">{b.name}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[9px] font-bold uppercase text-brandText-light">{b.plan_tier}</span>
                        {b.is_featured && (
                          <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-950 border border-amber-900 px-1.5 py-0.5 rounded">Featured</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          await run(() => updateBusinessAdminAction(b.id, { is_featured: !b.is_featured }));
                          await loadFeatured();
                        }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition ${
                          b.is_featured
                            ? "bg-amber-950 border-amber-900 text-amber-400 hover:bg-amber-900"
                            : "bg-slate-700 border-brandBorder-light text-brandText-light hover:text-amber-400"
                        }`}
                      >
                        {b.is_featured ? "Remove Featured" : "Set Featured"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Best-of Lists ──────────────────────────────────────────── */}
        {activeTab === "bestof" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: list of lists */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">Admin-Curated Lists</h2>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await run(() => createBestOfListAction(newListTitle, newListSlug, newListDesc), () => loadBestOf());
                  setNewListTitle(""); setNewListSlug(""); setNewListDesc("");
                }}
                className="space-y-2"
              >
                <input value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} required placeholder="List title (e.g. Top 10 Restaurants)" className="w-full bg-slate-50 border border-brandBorder-light text-brandText-dark text-xs rounded-lg px-3 py-2 focus:outline-none" />
                <input value={newListSlug} onChange={(e) => setNewListSlug(e.target.value)} required placeholder="url-slug" className="w-full bg-slate-50 border border-brandBorder-light text-brandText-dark text-xs font-mono rounded-lg px-3 py-2 focus:outline-none" />
                <input value={newListDesc} onChange={(e) => setNewListDesc(e.target.value)} placeholder="Short description" className="w-full bg-slate-50 border border-brandBorder-light text-brandText-dark text-xs rounded-lg px-3 py-2 focus:outline-none" />
                <button type="submit" className="w-full bg-brandRed hover:bg-brandRed-hover text-brandText-dark text-xs font-bold py-2 rounded-lg transition flex items-center justify-center space-x-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create List</span>
                </button>
              </form>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bestOfLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full text-left bg-slate-50 border rounded-lg px-3 py-2.5 transition ${
                      selectedListId === list.id ? "border-brandRed text-brandText-dark" : "border-brandBorder-light text-brandText-medium hover:border-brandBorder-light"
                    }`}
                  >
                    <p className="text-xs font-bold">{list.title}</p>
                    <p className="text-[10px] text-brandText-light mt-0.5">{list.items?.length || 0} items · /{list.slug}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: list items */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
              {selectedList ? (
                <>
                  <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider truncate">{selectedList.title}</h2>

                  {/* Add item form */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await run(() => addBestOfListItemAction(selectedList.id, addItemBusId, addItemRank), () => loadBestOf());
                      setAddItemBusId(""); setAddItemRank(1);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={addItemBusId}
                      onChange={(e) => setAddItemBusId(e.target.value)}
                      required
                      placeholder="Business ID (UUID)"
                      className="flex-grow bg-slate-50 border border-brandBorder-light text-brandText-dark text-xs font-mono rounded-lg px-3 py-2 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={addItemRank}
                      onChange={(e) => setAddItemRank(Number(e.target.value))}
                      min={1}
                      className="w-16 bg-slate-50 border border-brandBorder-light text-brandText-dark text-xs rounded-lg px-2 py-2 text-center focus:outline-none"
                    />
                    <button type="submit" className="bg-brandRed hover:bg-brandRed-hover text-brandText-dark p-2 rounded-lg transition">
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(selectedList.items || [])
                      .sort((a: any, b: any) => a.rank - b.rank)
                      .map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between bg-slate-50 border border-brandBorder-light rounded-lg px-3 py-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-brandText-light font-mono w-5 text-center">#{item.rank}</span>
                            <span className="text-brandText-dark font-medium">{item.business?.name}</span>
                          </div>
                          <button
                            onClick={() => run(() => removeBestOfListItemAction(item.id), () => loadBestOf())}
                            className="text-brandText-light hover:text-red-400 transition p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    {(!selectedList.items || selectedList.items.length === 0) && (
                      <p className="text-xs text-brandText-light italic text-center py-4">No items in this list yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-brandText-light space-y-2">
                  <ListOrdered className="h-8 w-8" />
                  <p className="text-xs">Select a list to manage its items</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Referrals ──────────────────────────────────────────────── */}
        {activeTab === "referrals" && (
          <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">
              Referral Tracking — {referrals.length} Total
            </h2>
            <div className="flex gap-4 text-xs mb-2">
              {["pending", "joined", "subscribed"].map((status) => {
                const count = referrals.filter((r) => r.status === status).length;
                return (
                  <div key={status} className="bg-slate-50 border border-brandBorder-light rounded-lg px-3 py-2 text-center min-w-[80px]">
                    <span className="text-brandText-light uppercase text-[9px] font-bold block">{status}</span>
                    <span className="text-lg font-black text-brandText-dark font-heading">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {referrals.length === 0 ? (
                <p className="text-xs text-brandText-light italic text-center py-8">No referrals recorded yet.</p>
              ) : (
                referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between bg-slate-50 border border-brandBorder-light rounded-lg px-4 py-3 text-xs">
                    <div>
                      <p className="text-brandText-dark font-medium">{ref.referrer?.full_name || "Unknown"} <span className="text-brandText-light">→</span> {ref.referred_email}</p>
                      <span className="text-[10px] text-brandText-light">{new Date(ref.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                      ref.status === "subscribed" ? "bg-emerald-950 border-emerald-900 text-emerald-400" :
                      ref.status === "joined" ? "bg-blue-950 border-blue-900 text-blue-400" :
                      "bg-slate-700 border-brandBorder-light text-brandText-light"
                    }`}>{ref.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Analytics ──────────────────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Listings", value: kpis.listings },
                { label: "Claimed", value: `${kpis.claimed} (${kpis.listings > 0 ? Math.round((kpis.claimed / kpis.listings) * 100) : 0}%)` },
                { label: "Active Subs", value: kpis.activeSubs },
                { label: "Total Referrals", value: kpis.totalReferrals },
              ].map((k) => (
                <div key={k.label} className="bg-brandBg-card border border-brandBorder-light rounded-xl p-4 text-center">
                  <span className="text-[10px] text-brandText-light uppercase tracking-wider font-bold block mb-1">{k.label}</span>
                  <span className="text-2xl font-black text-brandText-dark font-heading">{k.value}</span>
                </div>
              ))}
            </div>

            {/* Event type bars */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">Event Distribution (last 500 events)</h2>
              {Object.keys(eventCounts).length === 0 ? (
                <p className="text-xs text-brandText-light italic text-center py-4">No analytics events recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(eventCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono text-brandText-medium">{type}</span>
                          <span className="text-brandText-light font-bold">{count}</span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brandRed rounded-full transition-all duration-500"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* A/B Testing Hooks */}
            <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">A/B Experiment Toggles</h2>
                <span className="text-[9px] text-brandText-light italic">Stored locally — wire to feature flags for production</span>
              </div>
              <div className="space-y-3">
                {abTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between bg-slate-50 border border-brandBorder-light rounded-lg px-4 py-3">
                    <div>
                      <p className="text-xs text-brandText-dark">{test.name}</p>
                      <p className="text-[10px] text-brandText-light font-mono">{test.id}</p>
                    </div>
                    <button
                      onClick={() => setAbTests((prev) => prev.map((t) => t.id === test.id ? { ...t, enabled: !t.enabled } : t))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${test.enabled ? "bg-brandRed" : "bg-slate-700"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${test.enabled ? "translate-x-4" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Audit Log ──────────────────────────────────────────────── */}
        {activeTab === "auditlog" && (
          <div className="bg-brandBg-card border border-brandBorder-light rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-brandText-dark uppercase tracking-wider">
              Admin Audit Log — {auditLogs.length} Entries
            </h2>
            <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-brandText-light italic text-center py-8">No audit log entries yet. Actions taken by admins will appear here.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[auto_1fr_auto] gap-3 items-start bg-slate-50 border border-brandBorder-light/50 rounded-lg px-4 py-2.5 text-[11px]">
                    <div className="flex-shrink-0 w-24 truncate">
                      <span className="text-brandText-light">{log.admin?.full_name || "System"}</span>
                    </div>
                    <div>
                      <span className="font-mono text-brandRed font-bold">{log.action}</span>
                      {log.details && (
                        <span className="text-brandText-light ml-2 font-light">{log.details}</span>
                      )}
                    </div>
                    <span className="text-brandText-light text-[10px] flex-shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── RIGHT COLUMN WIDGETS ─────────────────────────────────────────── */}
      <aside className="lg:col-span-3 space-y-6">
        {/* Admin Profile & Quick Action Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center space-y-4">
          <div className="relative mx-auto w-20 h-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center shadow-inner overflow-hidden">
            <div className="w-full h-full bg-gradient-to-tr from-[#E8505B] to-red-400 flex items-center justify-center text-white text-2xl font-black font-heading">
              {(adminEmail || "A")[0].toUpperCase()}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 font-heading">
              System Admin
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
              {adminEmail || "admin@henrycounty.com"}
            </p>
            <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-50 text-[#E8505B] border border-red-100">
              Super Admin
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => switchTab("overview")}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200/60 transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Platform Overview</span>
            </button>

            <button
              onClick={() => switchTab("claims")}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200/60 transition flex items-center justify-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Claim Queue ({navBadges.claims || 0})</span>
            </button>

            <button
              onClick={() => switchTab("auditlog")}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200/60 transition flex items-center justify-center gap-2"
            >
              <ScrollText className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Logs ({auditLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Glossy Red Admin Security Pass Graphic Widget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="bg-gradient-to-br from-[#E8505B] via-[#D93845] to-[#991B1B] text-white rounded-2xl p-5 shadow-lg shadow-red-500/20 relative overflow-hidden flex flex-col justify-between h-44 border border-red-400/20">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-center z-10">
              <div className="w-9 h-7 rounded bg-amber-300/80 border border-amber-200/50 flex items-center justify-center shadow-inner">
                <div className="w-5 h-4 border border-amber-500/40 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                  <div className="bg-amber-400/60 rounded-xs"></div>
                  <div className="bg-amber-400/60 rounded-xs"></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-white font-bold text-[11px] tracking-tight">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-[10px]">
                  A
                </div>
                <span>ADMIN PASS</span>
              </div>
            </div>

            <div className="z-10 text-center tracking-widest font-mono text-sm sm:text-base font-semibold text-white/90 drop-shadow-xs">
              ••••  ••••  ••••  0001
            </div>

            <div className="flex justify-between items-end z-10 text-xs">
              <div>
                <div className="text-[8px] uppercase tracking-wider text-white/70 font-semibold">Operator</div>
                <div className="font-bold tracking-wide truncate max-w-[120px] uppercase text-white text-[11px]">
                  {adminEmail?.split("@")[0] || "SUPER ADMIN"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[8px] uppercase tracking-wider text-white/70 font-semibold">Security Pass</div>
                <div className="font-bold tracking-wide uppercase text-white text-[11px]">
                  VERIFIED ACCESS
                </div>
              </div>
            </div>
          </div>

          <Link 
            href="/"
            className="w-full text-center text-xs font-bold text-[#E8505B] hover:text-[#CF3641] transition-colors py-1 flex items-center justify-center gap-1.5 group cursor-pointer"
          >
            <span>View Live Directory</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </aside>
    </div>
  </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">Confirm Logout</h3>
            <p className="text-sm text-slate-500 mb-6 font-light">Are you sure you want to log out of the admin panel?</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <Link href="/api/auth/signout" className="flex-1">
                <button 
                  className="w-full px-4 py-2.5 bg-[#E8505B] hover:bg-[#CF3641] text-white font-bold text-xs rounded-xl transition-colors uppercase tracking-wider"
                >
                  Log Out
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
