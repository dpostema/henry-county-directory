"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { logout } from "../auth/actions";
import { hasFeatureAccess } from "@/utils/featureGate";
import { getEntitlements, type PlanTier } from "@/utils/entitlements";
import { siteConfig } from "@/config/site";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  updateListingAction,
  addListingMediaAction,
  deleteListingMediaAction,
  replyToReviewAction,
  answerQuestionAction,
  updateProfileAction,
  markLeadStatusAction,
  sendReferralAction,
  updateBookingStatusAction,
  replyToLeadMessageAction,
  generateAIDescriptionAction,
  generateAIReviewReplyAction,
} from "./actions";
import VisitorDashboard from "./VisitorDashboard";
import {
  LayoutDashboard,
  Edit,
  Inbox,
  Star,
  MessageSquare,
  Settings,
  LogOut,
  Building2,
  Plus,
  Trash,
  CheckCircle,
  ShieldAlert,
  ExternalLink,
  Volume2,
  VolumeX,
  CreditCard,
  Gift,
  Calendar,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  MapPin,
  ChevronDown
} from "lucide-react";

interface DashboardClientProps {
  initialBusinesses: any[];
  categories: any[];
  cities: any[];
  userProfile: any;
  visitorFavorites?: any[];
  visitorReviews?: any[];
}

export default function DashboardClient({
  initialBusinesses,
  categories,
  cities,
  userProfile,
  visitorFavorites = [],
  visitorReviews = [],
}: DashboardClientProps) {
  const [businesses] = useState<any[]>(initialBusinesses);
  const [selectedBusId, setSelectedBusId] = useState<string>(
    businesses[0]?.id || ""
  );

  // Active business derived state
  const activeBusiness = businesses.find((b) => b.id === selectedBusId) || null;
  const entitlements = getEntitlements(activeBusiness?.plan_tier as PlanTier);
  
  const [media, setMedia] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [qnas, setQnas] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "edit" | "leads" | "reviews" | "qna" | "settings" | "billing" | "bookings" | "marketing"
  >("overview");

  // Notifications

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newLeadNotification, setNewLeadNotification] = useState(false);

  // Form loader/alert states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [descInput, setDescInput] = useState("");
  const [reviewRepliesText, setReviewRepliesText] = useState<Record<string, string>>({});
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // Load details for selected business
  const fetchBusinessData = async (busId: string) => {
    if (!busId) return;

    // Fetch media
    const { data: mediaData } = await supabase
      .from("listing_media")
      .select("*")
      .eq("business_id", busId)
      .order("display_order", { ascending: true });
    setMedia(mediaData || []);

    // Fetch leads
    const { data: leadsData } = await supabase
      .from("leads")
      .select("*")
      .eq("business_id", busId)
      .order("created_at", { ascending: false });
    setLeads(leadsData || []);

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*, author:profiles(*), replies:review_replies(*)")
      .eq("business_id", busId)
      .order("created_at", { ascending: false });
    setReviews(reviewsData || []);

    // Fetch Q&A
    const { data: qnasData } = await supabase
      .from("qna")
      .select("*, visitor:profiles(*)")
      .eq("business_id", busId)
      .order("created_at", { ascending: false });
    setQnas(qnasData || []);

    // Fetch referrals
    const { data: refsData } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", userProfile.id)
      .order("created_at", { ascending: false });
    setReferrals(refsData || []);

    // Fetch bookings
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*, visitor:profiles(*)")
      .eq("business_id", busId)
      .order("booking_time", { ascending: true });
    setBookings(bookingsData || []);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinessData(selectedBusId);
      if (activeBusiness) {
        setDescInput(activeBusiness.description || "");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedBusId, activeBusiness?.id]);

  // Real data calculations for analytics
  const { totalEngagement, percentageChange, chartData } = useMemo(() => {
    let currentTotal = 0;
    let previousTotal = 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const processItems = (arr: any[], dateField: string = "created_at") => {
      arr.forEach(item => {
        if (!item[dateField]) return;
        const d = new Date(item[dateField]);
        if (d >= thirtyDaysAgo) {
          currentTotal++;
        } else if (d >= sixtyDaysAgo && d < thirtyDaysAgo) {
          previousTotal++;
        }
      });
    };

    processItems(leads);
    processItems(reviews);
    processItems(qnas);
    processItems(bookings, "booking_time");
    
    // Overall engagement count (all time)
    const engagement = leads.length + reviews.length + qnas.length + bookings.length;

    // Percentage change calculation
    let change = 0;
    if (previousTotal === 0) {
      change = currentTotal > 0 ? 100 : 0;
    } else {
      change = ((currentTotal - previousTotal) / previousTotal) * 100;
    }

    // Chart data for last 7 days
    const chart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      
      let count = 0;
      const countForDay = (arr: any[], dateField: string = "created_at") => {
        arr.forEach(item => {
          if (!item[dateField]) return;
          const itemDate = new Date(item[dateField]);
          if (itemDate >= d && itemDate < nextDay) count++;
        });
      };
      
      countForDay(leads);
      countForDay(reviews);
      countForDay(qnas);
      countForDay(bookings, "booking_time");
      
      chart.push({
        label: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' }).toUpperCase()}`,
        count,
      });
    }
    
    // Calculate heights relative to max
    const maxCount = Math.max(...chart.map(d => d.count), 1);
    const chartWithHeights = chart.map(d => ({
      ...d,
      height: `${Math.max((d.count / maxCount) * 100, 5)}%` // minimum 5% height so it's visible
    }));

    return {
      totalEngagement: engagement,
      percentageChange: change,
      chartData: chartWithHeights
    };
  }, [leads, reviews, qnas, bookings]);

  // Realtime leads subscription channel
  useEffect(() => {
    if (!selectedBusId) return;

    const channel = supabase
      .channel(`realtime-leads-${selectedBusId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `business_id=eq.${selectedBusId}`,
        },
        (payload) => {
          setLeads((prev) => [payload.new, ...prev]);
          setNewLeadNotification(true);
          // Play browser chime sound
          if (soundEnabled) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
              gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch (err) {
              console.log("Audio feedback block:", err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBusId, soundEnabled, supabase]);

  // Form updates
  const handleUpdateListing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("businessId", selectedBusId);

    const res = await updateListingAction(formData);
    setFormLoading(false);
    if (res?.error) {
      setFormError(res.error);
    } else if (res?.success) {
      setFormSuccess(res.success);
      fetchBusinessData(selectedBusId);
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoFile) return;
    
    setFormError(null);
    setFormLoading(true);

    const fileExt = newPhotoFile.name.split('.').pop() || 'jpg';
    const fileName = `${selectedBusId}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('business-images')
      .upload(fileName, newPhotoFile);

    if (uploadError) {
      setFormError("Failed to upload image.");
      setFormLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('business-images')
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      setFormError("Failed to retrieve public URL.");
      setFormLoading(false);
      return;
    }

    const res = await addListingMediaAction(selectedBusId, publicUrlData.publicUrl);
    setFormLoading(false);

    if (res?.success) {
      setNewPhotoFile(null);
      (e.target as HTMLFormElement).reset();
      fetchBusinessData(selectedBusId);
    } else if (res?.error) {
      setFormError(res.error);
    }
  };

  const handleDeletePhoto = async (mediaId: string) => {
    const res = await deleteListingMediaAction(mediaId, selectedBusId);
    if (res?.success) {
      fetchBusinessData(selectedBusId);
    }
  };

  const handleLeadStatusChange = async (leadId: string, status: "read" | "archived") => {
    const res = await markLeadStatusAction(leadId, status);
    if (res?.success) {
      fetchBusinessData(selectedBusId);
    }
  };

  const handleReviewReply = async (e: React.FormEvent<HTMLFormElement>, reviewId: string) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const replyText = formData.get("reply") as string;
    if (!replyText.trim()) return;

    const res = await replyToReviewAction(reviewId, replyText);
    if (res?.success) {
      fetchBusinessData(selectedBusId);
      form.reset();
    } else if (res?.error) {
      alert(res.error);
    }
  };

  const handleAnswerQuestion = async (e: React.FormEvent<HTMLFormElement>, qnaId: string) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const answerText = formData.get("answer") as string;
    if (!answerText.trim()) return;

    const res = await answerQuestionAction(qnaId, answerText);
    if (res?.success) {
      fetchBusinessData(selectedBusId);
      form.reset();
    } else if (res?.error) {
      alert(res.error);
    }
  };

  const handleSendChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !chatInput.trim()) return;
    setFormLoading(true);

    const res = await replyToLeadMessageAction(selectedLeadId, chatInput);
    setFormLoading(false);

    if (res.success) {
      setChatInput("");
      // Update local leads list message with the new thread!
      if (res.thread) {
        setLeads(prevLeads => prevLeads.map(l => {
          if (l.id === selectedLeadId) {
            return { ...l, message: JSON.stringify(res.thread), status: "read" };
          }
          return l;
        }));
      }
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("fullName") as string;

    const res = await updateProfileAction(name);
    setFormLoading(false);
    if (res?.error) {
      setFormError(res.error);
    } else if (res?.success) {
      setFormSuccess(res.success);
    }
  };
  const [billingLoading, setBillingLoading] = useState(false);
  const [referralEmail, setReferralEmail] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleUpgrade = async (planTier: string | null, addonType: string | null = null) => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusId,
          planTier,
          addonType,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error initiating checkout: " + err.message);
    } finally {
      setBillingLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: selectedBusId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to load portal');
      }
    } catch (err) {
      alert('Error loading portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralEmail.trim()) return;
    setReferralLoading(true);

    const res = await sendReferralAction(referralEmail);
    setReferralLoading(false);

    if (res.success) {
      alert(res.success);
      setReferralEmail("");
      fetchBusinessData(selectedBusId);
    } else if (res.error) {
      alert(res.error);
    }
  };

  // Realtime leads subscription channel
  useEffect(() => {
    if (!selectedBusId) return;

    const topic = `leads-rt-${selectedBusId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(topic);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `business_id=eq.${selectedBusId}`,
        },
        (payload) => {
          setLeads((prev) => [payload.new, ...prev]);
          setNewLeadNotification(true);
          if (soundEnabled) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch (err) {
              console.log("Audio feedback block:", err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBusId, soundEnabled, supabase]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (businesses.length === 0) {
    return (
      <VisitorDashboard 
        userProfile={userProfile} 
        favorites={visitorFavorites} 
        reviews={visitorReviews} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between font-body text-brandText-medium">
      {/* Main Grid Workspace */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR NAV */}
          <aside className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-6">
            {/* Header / Brand Logo */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <Link href="/" className="flex-shrink-0">
                <Image 
                  src="/logo.svg" 
                  alt="Henry County Directory Logo" 
                  width={36} 
                  height={36} 
                  className="object-contain transition-transform hover:scale-105" 
                />
              </Link>
              <div>
                <span className="font-heading font-black text-base tracking-tight text-slate-900 block leading-tight">
                  {siteConfig.name}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                  Business Portal
                </span>
              </div>
            </div>

            {/* Listing Switcher Dropdown */}
            {businesses.length > 1 && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Listing
                </label>
                <Select value={selectedBusId} onValueChange={(val) => setSelectedBusId(val || "")}>
                  <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E8505B] text-slate-800">
                    <SelectValue placeholder="Select Business..." />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Nav Links */}
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Main Menu
              </div>
              {[
                { label: "Overview", tab: "overview", icon: LayoutDashboard },
                { label: "Edit Listing", tab: "edit", icon: Edit },
                { label: "Leads Inbox", tab: "leads", icon: Inbox, badge: leads.filter((l) => l.status === "new").length, locked: !entitlements.has_messaging_inbox },
                { label: "Bookings", tab: "bookings", icon: Calendar, badge: bookings.filter((b) => b.status === "pending").length, locked: !entitlements.has_booking_calendar },
                { label: "Reviews Feed", tab: "reviews", icon: Star },
                { label: "Questions Board", tab: "qna", icon: MessageSquare, badge: qnas.filter((q) => !q.answer).length },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      if (item.locked) {
                        setActiveTab("billing");
                      } else {
                        setActiveTab(item.tab as any);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                      isActive
                        ? "bg-[#E8505B] text-white shadow-md shadow-red-500/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                      {item.locked && (
                        <span className="bg-slate-100 text-[9px] text-slate-400 px-1.5 py-0.5 rounded tracking-wider uppercase font-semibold">
                          Locked
                        </span>
                      )}
                    </div>
                    {item.badge && item.badge > 0 && !item.locked ? (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isActive ? "bg-white text-[#E8505B]" : "bg-[#E8505B] text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}

              <div className="pt-3 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Services & Billing
              </div>
              {[
                { label: "Billing & Referrals", tab: "billing", icon: CreditCard },
                { label: "Marketing Tools", tab: "marketing", icon: Sparkles },
                { label: "Account Settings", tab: "settings", icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab as any)}
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
                  </button>
                );
              })}
            </div>

            {/* Sidebar User Profile Pill & Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-[#E8505B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {(userProfile?.full_name || activeBusiness?.name || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {userProfile?.full_name || "Business Owner"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {userProfile?.email || "Owner Account"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Site</span>
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

          {/* MAIN CENTER WORKSPACE */}
          <main className="lg:col-span-6 space-y-6">
            {/* Soft Claim Banner */}
            {activeBusiness?.verification_level === "claimed_unverified" && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3 text-orange-850">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-orange-600" />
                <div className="text-xs leading-relaxed">
                  <h4 className="font-bold">Claim Review Pending Approval</h4>
                  <p className="font-light mt-0.5">
                    You have been granted soft-claim access to edit details immediately. Full verification will be finalized by admin review.
                  </p>
                </div>
              </div>
            )}

            {/* Realtime Lead Alert Notification */}
            {newLeadNotification && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between text-emerald-800 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold">New lead received in real-time!</span>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("leads");
                    setNewLeadNotification(false);
                  }}
                  className="font-bold underline hover:text-emerald-950"
                >
                  Open Inbox
                </button>
              </div>
            )}

            {/* Active Views */}
            {activeTab === "overview" && (
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

                {/* HSBC Style Metric & Red Bar Chart Card */}
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

                  {/* Red Bar Chart Visual */}
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

                {/* HSBC Style Recent Activity List Card */}
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
            )}

            {activeTab === "edit" && (
              <div className="space-y-8">
                <form onSubmit={handleUpdateListing} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-slate-900 font-heading border-b border-slate-100 pb-3">
                    Listing Specifications
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={activeBusiness?.name}
                        className="w-full p-2 text-sm border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <Select name="categoryId" defaultValue={activeBusiness?.category_id ? String(activeBusiness.category_id) : undefined}>
                        <SelectTrigger className="w-full p-2 text-sm border border-slate-200 rounded-xl bg-white">
                          <SelectValue placeholder="Select Category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        City
                      </label>
                      <Select name="cityId" defaultValue={activeBusiness?.city_id ? String(activeBusiness.city_id) : undefined}>
                        <SelectTrigger className="w-full p-2 text-sm border border-slate-200 rounded-xl bg-white">
                          <SelectValue placeholder="Select City..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={String(city.id)}>
                              {city.name}, GA
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Address Details
                      </label>
                      <input
                        type="text"
                        name="address"
                        defaultValue={activeBusiness?.address || ""}
                        className="w-full p-2 text-sm border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={activeBusiness?.phone || ""}
                      className="w-full p-2 text-sm border border-brandBorder-light rounded-btn"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-dark mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={activeBusiness?.email || ""}
                      className="w-full p-2 text-sm border border-brandBorder-light rounded-btn"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-dark mb-1">
                      Website URL
                    </label>
                    <input
                      type="text"
                      name="website"
                      defaultValue={activeBusiness?.website || ""}
                      className="w-full p-2 text-sm border border-brandBorder-light rounded-btn"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-brandText-dark">
                      Business Description
                    </label>

                    {hasFeatureAccess(activeBusiness?.plan_tier, "ai_tools") ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!activeBusiness) return;
                          setFormLoading(true);
                          const activeCat = categories.find((c) => c.id === activeBusiness.category_id)?.name || "";
                          const res = await generateAIDescriptionAction(activeBusiness.name, activeCat);
                          setFormLoading(false);
                          if (res.description) {
                            setDescInput(res.description);
                          } else if (res.error) {
                            alert(res.error);
                          }
                        }}
                        className="inline-flex items-center text-[10px] font-bold text-brandRed hover:text-brandRed-hover space-x-1"
                      >
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        <span>AI Suggest Description</span>
                      </button>
                    ) : (
                      <span className="text-[9px] text-brandText-light italic">Upgrade to Pro/Enterprise for AI Writer helper</span>
                    )}
                  </div>
                  <textarea
                    name="description"
                    rows={4}
                    value={descInput}
                    maxLength={entitlements.max_description_chars > 10000 ? undefined : entitlements.max_description_chars}
                    onChange={(e) => setDescInput(e.target.value)}
                    className="w-full p-2.5 text-sm border border-brandBorder-light rounded-btn"
                  />
                  <div className="flex justify-between mt-1 text-[10px]">
                    <span className={descInput.length >= entitlements.max_description_chars ? "text-red-500 font-bold" : "text-brandText-light"}>
                      {descInput.length} / {entitlements.max_description_chars > 10000 ? "Unlimited" : entitlements.max_description_chars} characters
                    </span>
                    {descInput.length >= entitlements.max_description_chars && (
                       <button type="button" onClick={() => setActiveTab("billing")} className="text-brandRed underline font-bold">Upgrade for longer descriptions</button>
                    )}
                  </div>
                </div>

                {/* Operating Hours Scheduler */}
                <div className="space-y-3 pt-3">
                  <label className="block text-xs font-bold text-brandText-dark border-b border-brandBorder-light pb-2">
                    Operating Schedule
                  </label>
                  <div className="space-y-3">
                    {days.map((day) => {
                      const dayHours = activeBusiness?.hours_json?.[day];
                      const isClosedInitial = !dayHours || dayHours.closed;
                      return (
                        <div
                          key={day}
                          className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pb-2 border-b border-brandBorder-light last:border-b-0 last:pb-0 gap-2"
                        >
                          <span className="font-semibold text-brandText-dark w-24">{day}</span>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-1.5">
                              <input
                                type="checkbox"
                                name={`hours.${day}.closed`}
                                value="true"
                                defaultChecked={isClosedInitial}
                                className="rounded text-brandRed focus:ring-brandRed"
                              />
                              <span>Closed</span>
                            </label>

                            <div className="flex items-center space-x-1">
                              <input
                                type="time"
                                name={`hours.${day}.open`}
                                defaultValue={dayHours?.open || "09:00"}
                                className="p-1 border border-brandBorder-light rounded text-[11px]"
                              />
                              <span>to</span>
                              <input
                                type="time"
                                name={`hours.${day}.close`}
                                defaultValue={dayHours?.close || "17:00"}
                                className="p-1 border border-brandBorder-light rounded text-[11px]"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold px-4 py-2 rounded-btn shadow-sm transition disabled:opacity-50"
                >
                  {formLoading ? "Saving Updates..." : "Save Listing Info"}
                </button>
              </form>

            {/* Photos Panel */}
              <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-brandBorder-light pb-3">
                  <h3 className="text-base font-bold text-brandText-dark font-heading">
                    Listing Media Gallery
                  </h3>
                  <span className="text-xs font-semibold text-brandText-medium">
                    {media.length} / {entitlements.max_photos > 1000 ? "Unlimited" : entitlements.max_photos} Photos
                  </span>
                </div>

                <form onSubmit={handleAddPhoto} className="flex gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setNewPhotoFile(e.target.files[0]);
                      } else {
                        setNewPhotoFile(null);
                      }
                    }}
                    required
                    disabled={media.length >= entitlements.max_photos || formLoading}
                    className="w-full p-2 text-xs border border-brandBorder-light rounded-btn disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={media.length >= entitlements.max_photos || formLoading || !newPhotoFile}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-btn shadow-sm transition flex-shrink-0 flex items-center space-x-1 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{formLoading ? "Uploading..." : "Add"}</span>
                  </button>
                </form>

                {media.length >= entitlements.max_photos && (
                  <div className="p-3 bg-red-50 text-red-800 text-xs rounded-btn border border-red-100 flex justify-between items-center">
                    <span>You have reached your photo limit.</span>
                    <button type="button" onClick={() => setActiveTab("billing")} className="underline font-bold">Upgrade Plan</button>
                  </div>
                )}

                {media.length === 0 ? (
                  <p className="text-xs text-brandText-light italic py-4 text-center">No images uploaded.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {media.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-video rounded-btn overflow-hidden border border-brandBorder-light bg-slate-100 group"
                      >
                        <Image src={photo.url} alt="Listing Photo" width={500} height={300} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1 rounded-full hover:bg-brandRed transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "leads" && (
            <div className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-brandBorder-light pb-3">
                <h3 className="text-base font-bold text-brandText-dark font-heading">
                  Realtime Customer Leads Inbox
                </h3>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-xs text-brandText-light hover:text-brandRed flex items-center space-x-1.5"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="h-4.5 w-4.5" />
                      <span>Chime Enabled</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4.5 w-4.5" />
                      <span>Chime Muted</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Leads sidebar list */}
                <div className="md:col-span-2 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {leads.length === 0 ? (
                    <p className="text-xs text-brandText-light italic py-8 text-center border border-dashed border-brandBorder-light rounded-card">
                      No leads received yet.
                    </p>
                  ) : (
                    leads.map((lead, index) => {
                      const isLocked = index >= entitlements.max_leads_per_month;
                      
                      return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          if (isLocked) {
                            setActiveTab("billing");
                            return;
                          }
                          setSelectedLeadId(lead.id);
                          if (lead.status === "new") {
                            handleLeadStatusChange(lead.id, "read");
                          }
                        }}
                        className={`relative p-3.5 rounded-xl border cursor-pointer transition text-left overflow-hidden ${
                          selectedLeadId === lead.id
                            ? "border-brandRed bg-red-50/15 shadow-sm"
                            : lead.status === "new"
                            ? "bg-slate-100/50 border-brandRed/30 hover:bg-slate-100"
                            : "bg-white border-brandBorder-light hover:bg-slate-50 opacity-80"
                        }`}
                      >
                        {isLocked && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-800 bg-white px-2 py-1 rounded shadow-sm flex items-center space-x-1">
                              <span>Locked • Upgrade to View</span>
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-brandText-dark font-heading truncate max-w-[120px]">
                            {lead.name}
                          </span>
                          {lead.status === "new" && (
                            <span className="text-[8px] font-black uppercase text-brandRed bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-btn">
                              New
                            </span>
                          )}
                        </div>

                        {/* Snippet message */}
                        <p className="text-[11px] text-brandText-light truncate mb-2">
                          {(() => {
                            try {
                              const parsed = JSON.parse(lead.message);
                              if (Array.isArray(parsed)) {
                                return parsed[parsed.length - 1]?.text || "";
                              }
                              return lead.message;
                            } catch {
                              return lead.message;
                            }
                          })()}
                        </p>

                        <div className="flex justify-between items-center text-[9px] text-brandText-light">
                          <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                          {lead.ai_tag && (
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                lead.ai_tag === "High Intent"
                                  ? "bg-red-50 text-red-700"
                                  : lead.ai_tag === "Employment Inquiry"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {lead.ai_tag}
                            </span>
                          )}
                        </div>
                      </div>
                    )})
                  )}
                </div>

                {/* Active Chat pane */}
                <div className="md:col-span-3 border border-brandBorder-light rounded-xl flex flex-col justify-between h-[500px] bg-slate-50 overflow-hidden shadow-inner">
                  {selectedLeadId ? (
                    (() => {
                      const activeLead = leads.find((l) => l.id === selectedLeadId);
                      if (!activeLead) return null;

                      let thread: any[] = [];
                      try {
                        const parsed = JSON.parse(activeLead.message);
                        if (Array.isArray(parsed)) {
                          thread = parsed;
                        } else {
                          thread = [{ sender: "visitor", text: activeLead.message, time: activeLead.created_at }];
                        }
                      } catch {
                        thread = [{ sender: "visitor", text: activeLead.message, time: activeLead.created_at }];
                      }

                      const hasInboxAccess = entitlements.has_messaging_inbox;

                      return (
                        <>
                          {/* Chat Header */}
                          <div className="p-3.5 bg-white border-b border-brandBorder-light flex justify-between items-center flex-shrink-0">
                            <div>
                              <h4 className="text-xs font-bold text-brandText-dark">
                                Conversation with {activeLead.name}
                              </h4>
                              <p className="text-[10px] text-brandText-light font-light mt-0.5">
                                {activeLead.email} {activeLead.phone ? `| ${activeLead.phone}` : ""}
                              </p>
                            </div>
                            
                            <div className="flex space-x-1">
                              {activeLead.status !== "archived" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleLeadStatusChange(activeLead.id, "archived");
                                    setSelectedLeadId(null);
                                  }}
                                  className="text-[9px] font-bold border border-brandBorder-light bg-slate-50 px-2 py-1 rounded hover:bg-slate-100"
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Chat Messages */}
                          <div className="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col">
                            {thread.map((msg, index) => {
                              const isOwner = msg.sender === "owner";
                              return (
                                <div
                                  key={index}
                                  className={`flex flex-col max-w-[80%] ${
                                    isOwner ? "self-end items-end" : "self-start items-start"
                                  }`}
                                >
                                  <span className="text-[8px] text-brandText-light font-semibold mb-0.5">
                                    {isOwner ? "You (Owner)" : activeLead.name}
                                  </span>
                                  <div
                                    className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                                      isOwner
                                        ? "bg-slate-900 text-white rounded-tr-none"
                                        : "bg-white text-slate-800 border border-brandBorder-light rounded-tl-none"
                                    }`}
                                  >
                                    {msg.text}
                                  </div>
                                  {msg.time && (
                                    <span className="text-[8px] text-brandText-light font-light mt-0.5">
                                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Chat Form */}
                          <div className="p-3 bg-white border-t border-brandBorder-light flex-shrink-0">
                            {hasInboxAccess ? (
                              <form onSubmit={handleSendChatReply} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Type your message reply..."
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  className="w-full p-2 text-xs border border-brandBorder-light rounded-btn bg-slate-50 focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  disabled={formLoading || !chatInput.trim()}
                                  className="bg-brandRed hover:bg-brandRed-hover text-white font-bold text-xs px-4 py-2 rounded-btn transition duration-200 disabled:opacity-40"
                                >
                                  Reply
                                </button>
                              </form>
                            ) : (
                              <div className="p-3 bg-red-50/50 border border-red-100 rounded-btn text-center space-y-1">
                                <span className="text-[9px] font-bold text-brandRed uppercase tracking-wider block">
                                  Premium Feature
                                </span>
                                <p className="text-[10px] text-brandText-light font-light leading-relaxed">
                                  Owner replies are disabled on the Free tier. Upgrade to Pro/Enterprise to chat with leads.
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-brandText-light space-y-3">
                      <Inbox className="h-10 w-10 text-slate-300" />
                      <div>
                        <h4 className="text-xs font-bold text-brandText-dark">No Conversation Selected</h4>
                        <p className="text-[10px] font-light mt-0.5 leading-relaxed">
                          Select a customer inquiry from the sidebar inbox to read thread logs and chat directly in real-time.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-6">
              <h3 className="text-base font-bold text-brandText-dark font-heading border-b border-brandBorder-light pb-3">
                Reviews Feed ({reviews.length})
              </h3>

              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-xs text-brandText-light italic text-center py-6">
                    No reviews received on this listing yet.
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-brandBorder-light pb-6 last:border-b-0 last:pb-0 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-brandText-dark font-heading">
                            {rev.author?.full_name || "Anonymous Local"}
                          </h4>
                          <span className="text-[10px] text-brandText-light block mt-0.5">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Rating stars */}
                        <div className="flex items-center text-badge-rating space-x-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < rev.rating ? "fill-current" : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-brandText-medium font-light leading-relaxed italic pl-2 border-l-2 border-slate-200">
                        &ldquo;{rev.comment}&rdquo;
                      </p>

                      {/* Display replies */}
                      {rev.replies && rev.replies.length > 0 ? (
                        <div className="bg-slate-50 p-3 rounded-xl border border-brandBorder-light pl-4 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-badge-verified tracking-wider block">
                            Your Reply
                          </span>
                          <p className="text-xs text-brandText-medium font-light leading-relaxed">
                            {rev.replies[0].reply}
                          </p>
                          <span className="text-[9px] text-brandText-light block mt-1">
                            Posted {new Date(rev.replies[0].created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        /* Post reply form */
                         <form
                          onSubmit={(e) => handleReviewReply(e, rev.id)}
                          className="flex flex-col gap-2 pl-4 pt-1"
                        >
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-semibold text-brandText-light">Write Response</span>
                            
                            {hasFeatureAccess(activeBusiness?.plan_tier, "ai_tools") ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  setFormLoading(true);
                                  const res = await generateAIReviewReplyAction(rev.rating, rev.comment);
                                  setFormLoading(false);
                                  if (res.reply) {
                                    setReviewRepliesText({
                                      ...reviewRepliesText,
                                      [rev.id]: res.reply,
                                    });
                                  } else if (res.error) {
                                    alert(res.error);
                                  }
                                }}
                                className="text-brandRed hover:text-brandRed-hover font-bold inline-flex items-center space-x-1"
                              >
                                <Sparkles className="h-3 w-3 animate-pulse text-brandRed" />
                                <span>Suggest AI Response</span>
                              </button>
                            ) : (
                              <span className="italic text-brandText-light text-[9px]">Upgrade to Pro/Enterprise for AI replies</span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              name="reply"
                              required
                              value={reviewRepliesText[rev.id] || ""}
                              onChange={(e) => setReviewRepliesText({
                                ...reviewRepliesText,
                                [rev.id]: e.target.value,
                              })}
                              placeholder="Type response to this feedback..."
                              className="w-full p-2 text-xs border border-brandBorder-light rounded-btn bg-slate-50"
                            />
                            <button
                              type="submit"
                              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded-btn shadow-sm transition flex-shrink-0"
                            >
                              Reply
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "qna" && (
            <div className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-6">
              <h3 className="text-base font-bold text-brandText-dark font-heading border-b border-brandBorder-light pb-3">
                Visitor Q&A Board ({qnas.length})
              </h3>

              <div className="space-y-6">
                {qnas.length === 0 ? (
                  <p className="text-xs text-brandText-light italic text-center py-6">
                    No questions asked yet.
                  </p>
                ) : (
                  qnas.map((q) => (
                    <div key={q.id} className="p-4 rounded-xl border border-brandBorder-light bg-slate-50/50 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-brandRed uppercase tracking-wider block mb-1">
                          Question
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-brandText-dark leading-relaxed">
                          {q.question}
                        </p>
                        <span className="text-[9px] text-brandText-light block mt-0.5">
                          Asked by {q.visitor?.full_name || "Visitor"} on {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {q.answer ? (
                        <div className="border-t border-brandBorder-light pt-3 pl-4 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-badge-verified tracking-wider block">
                            Your Answer
                          </span>
                          <p className="text-xs text-brandText-medium font-light leading-relaxed">
                            {q.answer}
                          </p>
                          <span className="text-[9px] text-brandText-light block mt-1">
                            Answered on {q.answered_at ? new Date(q.answered_at).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      ) : (
                        /* Answer input */
                        <form
                          onSubmit={(e) => handleAnswerQuestion(e, q.id)}
                          className="border-t border-brandBorder-light pt-3 pl-4 space-y-2"
                        >
                          <label className="block text-[10px] font-bold text-brandText-medium uppercase">
                            Type Answer
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              name="answer"
                              required
                              placeholder="Provide details to answer the visitor..."
                              className="w-full p-2 text-xs border border-brandBorder-light rounded-btn bg-white"
                            />
                            <button
                              type="submit"
                              className="bg-brandRed hover:bg-brandRed-hover text-white text-[10px] font-bold px-3 py-2 rounded-btn shadow-sm transition flex-shrink-0"
                            >
                              Submit
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Profile details */}
              <form onSubmit={handleUpdateProfile} className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-4">
                <h3 className="text-base font-bold text-brandText-dark font-heading border-b border-brandBorder-light pb-2">
                  Account Details
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-brandText-dark mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    defaultValue={userProfile?.full_name}
                    className="w-full p-2.5 text-sm border border-brandBorder-light rounded-btn"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-dark mb-1">
                    Email Address (read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userProfile?.email}
                    className="w-full p-2.5 text-sm border border-brandBorder-light rounded-btn bg-slate-100 text-brandText-light cursor-not-allowed"
                  />
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

                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-btn shadow-sm transition disabled:opacity-50"
                >
                  {formLoading ? "Saving Updates..." : "Save Profile Details"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-6">
              <div className="border-b border-brandBorder-light pb-3">
                <h3 className="text-base font-bold text-brandText-dark font-heading">
                  Appointment Bookings Calendar
                </h3>
              </div>

              {!entitlements.has_booking_calendar ? (
                <div className="p-8 border border-dashed border-brandBorder-light rounded-xl text-center space-y-3 bg-slate-50/50">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
                  <span className="text-[10px] font-black text-brandRed uppercase tracking-wider block">
                    Premium Feature
                  </span>
                  <p className="text-xs text-brandText-light font-light max-w-md mx-auto leading-relaxed">
                    Online booking appointments management is a Pro feature. Upgrade to Pro/Enterprise plan to allow visitors to request slots and manage them inside this calendar dashboard.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("billing")}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-btn transition"
                  >
                    Upgrade Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {bookings.length === 0 ? (
                    <p className="text-xs text-brandText-light italic text-center py-8">
                      No appointment requests received yet.
                    </p>
                  ) : (
                    bookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-xl border border-brandBorder-light bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left font-sans"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-brandText-dark">
                              {b.visitor?.full_name || "Visitor"}
                            </span>
                            <span
                              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                b.status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-800 font-semibold"
                                  : b.status === "cancelled"
                                  ? "bg-red-50 text-red-800 font-semibold"
                                  : "bg-amber-50 text-amber-800 font-semibold"
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <p className="text-brandText-medium font-semibold">
                            Time: {new Date(b.booking_time).toLocaleString()}
                          </p>
                          {b.details && (
                            <p className="text-[11px] text-brandText-light italic font-light">
                              &ldquo;{b.details}&rdquo;
                            </p>
                          )}
                        </div>

                        {b.status === "pending" && (
                          <div className="flex space-x-2 text-[9px] font-bold">
                            <button
                              type="button"
                              onClick={async () => {
                                setFormLoading(true);
                                const res = await updateBookingStatusAction(b.id, "confirmed");
                                setFormLoading(false);
                                if (res.success) {
                                  alert(res.success);
                                  fetchBusinessData(selectedBusId);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded shadow-sm transition"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                setFormLoading(true);
                                const res = await updateBookingStatusAction(b.id, "cancelled");
                                setFormLoading(false);
                                if (res.success) {
                                  alert(res.success);
                                  fetchBusinessData(selectedBusId);
                                }
                              }}
                              className="border border-brandBorder-light bg-white text-brandText-dark px-3 py-1.5 rounded hover:bg-slate-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}



          {activeTab === "marketing" && (
            <div className="space-y-8 text-left font-sans">
              <div className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-4">
                <div className="border-b border-brandBorder-light pb-2">
                  <h3 className="text-sm font-bold text-brandText-dark font-heading">
                    QR Code Generator
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {typeof window !== "undefined" && (() => {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + "/listings/" + activeBusiness?.slug)}`;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrUrl}
                        alt="Listing QR Code"
                        className="w-44 h-44 bg-white border border-brandBorder-light p-2.5 rounded shadow-sm flex-shrink-0"
                      />
                    );
                  })()}

                  <div className="space-y-3 text-xs leading-relaxed font-light">
                    <p className="text-brandText-medium font-bold">
                      Direct Review Access Code
                    </p>
                    <p className="text-brandText-light">
                      Print and place this custom QR code on tables, registers, window decals, or receipts. Customers scan it with their phone cameras to instantly access your listing profile and submit reviews.
                    </p>
                    {typeof window !== "undefined" && (
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                          window.location.origin + "/listings/" + activeBusiness?.slug
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded shadow-sm transition"
                      >
                        Download High-Res QR
                      </a>
                    )}
                  </div>
                </div>
              </div>


            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-8">
              {/* Billing Info Notice */}
              <div className="p-4 bg-slate-100 rounded-card border border-brandBorder-light shadow-sm text-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-brandText-dark">Billing Integration Status</h4>
                  <p className="text-brandText-light font-light mt-0.5">
                    {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
                      ? "Stripe API keys not loaded. The checkout triggers simulated instant upgrades for developer testing."
                      : "Stripe connection active. Test payments are processed securely."}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded uppercase tracking-wider">
                  {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Simulation Mode" : "Stripe Active"}
                </span>
              </div>

              {/* Plans Upgrade Grid */}
              <section className="space-y-4">
                <h3 className="text-base font-bold text-brandText-dark font-heading">
                  Available Pricing Tiers
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Plan 1: Featured */}
                  <div className="bg-brandBg-card p-5 rounded-card border border-brandBorder-light shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-brandRed uppercase bg-red-50 border border-red-100 px-2 py-0.5 rounded-btn">
                        Featured Tier
                      </span>
                      <h4 className="text-base font-bold text-brandText-dark font-heading">Featured Listing</h4>
                      <p className="text-2xl font-black text-brandText-dark">$19<span className="text-xs font-light">/mo</span></p>
                      <ul className="text-[11px] text-brandText-light font-light space-y-1">
                        <li>&bull; Featured banner placements</li>
                        <li>&bull; Highlights in search results</li>
                        <li>&bull; Up to 5 media slots</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleUpgrade("featured")}
                      disabled={billingLoading || activeBusiness?.plan_tier === "featured"}
                      className="w-full bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold py-2 rounded-btn shadow-sm transition disabled:opacity-50"
                    >
                      {activeBusiness?.plan_tier === "featured" ? "Active Plan" : billingLoading ? "Loading..." : "Subscribe"}
                    </button>
                  </div>

                  {/* Plan 2: Pro */}
                  <div className="bg-brandBg-card p-5 rounded-card border border-brandRed/20 shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden ring-1 ring-brandRed/30">
                    <span className="absolute top-2 right-2 text-[8px] font-bold text-white bg-brandRed px-2 py-0.5 rounded uppercase tracking-wider">
                      Popular
                    </span>

                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-slate-800 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-btn">
                        Pro Tier
                      </span>
                      <h4 className="text-base font-bold text-brandText-dark font-heading">Pro Tools Package</h4>
                      <p className="text-2xl font-black text-brandText-dark">$49<span className="text-xs font-light">/mo</span></p>
                      <ul className="text-[11px] text-brandText-light font-light space-y-1">
                        <li>&bull; Booking Appointment Calendar</li>
                        <li>&bull; Integrated Client Inbox</li>
                        <li>&bull; AI Description Writer</li>
                        <li>&bull; Competitor Benchmarking</li>
                        <li>&bull; Up to 10 media slots</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleUpgrade("pro")}
                      disabled={billingLoading || activeBusiness?.plan_tier === "pro"}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-btn shadow-sm transition disabled:opacity-50"
                    >
                      {activeBusiness?.plan_tier === "pro" ? "Active Plan" : billingLoading ? "Loading..." : "Subscribe"}
                    </button>
                  </div>

                  {/* Plan 3: Enterprise */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-indigo-800 uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        Enterprise Tier
                      </span>
                      <h4 className="text-base font-bold text-slate-900 font-heading">Enterprise Suite</h4>
                      <p className="text-2xl font-black text-slate-900">$99<span className="text-xs font-light">/mo</span></p>
                      <ul className="text-[11px] text-slate-500 font-light space-y-1">
                        <li>&bull; Multi-location Dashboard</li>
                        <li>&bull; Priority support hotline</li>
                        <li>&bull; Competitor insights reports</li>
                        <li>&bull; Unlimited photo slots</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleUpgrade("enterprise")}
                      disabled={billingLoading || activeBusiness?.plan_tier === "enterprise"}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                      {activeBusiness?.plan_tier === "enterprise" ? "Active Plan" : billingLoading ? "Loading..." : "Subscribe"}
                    </button>
                  </div>
                </div>
              </section>

              {/* Add-ons Grid */}
              <section className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  One-time Addons
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Addon 1 */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900">30-Day Listing Boost</h4>
                      <p className="text-slate-500 font-light">Make your listing featured for 30 days immediately.</p>
                      <span className="text-sm font-black text-[#E8505B] mt-1 block">$10.00</span>
                    </div>

                    <button
                      onClick={() => handleUpgrade(null, "listing_boost_30day")}
                      disabled={billingLoading}
                      className="bg-[#E8505B] hover:bg-[#CF3641] text-white font-bold px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50 flex-shrink-0"
                    >
                      Purchase
                    </button>
                  </div>

                  {/* Addon 2 */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900">AI Writer Assistant Pack</h4>
                      <p className="text-slate-500 font-light">Unlocks AI writing templates and automated qualifiers.</p>
                      <span className="text-sm font-black text-[#E8505B] mt-1 block">$10.00</span>
                    </div>

                    <button
                      onClick={() => handleUpgrade(null, "ai_description_writer")}
                      disabled={billingLoading}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50 flex-shrink-0"
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              </section>


            </div>
          )}
        </main>

        {/* RIGHT COLUMN WIDGETS */}
        <aside className="lg:col-span-3 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center space-y-4">
            <div className="relative mx-auto w-20 h-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center shadow-inner overflow-hidden">
              {userProfile?.avatar_url ? (
                <Image src={userProfile.avatar_url} alt={userProfile.full_name || "User"} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#E8505B] to-red-400 flex items-center justify-center text-white text-2xl font-black font-heading">
                  {(userProfile?.full_name || activeBusiness?.name || "G")[0].toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 font-heading">
                {userProfile?.full_name || "Ginette Sarclay"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {activeBusiness?.city?.name ? `${activeBusiness.city.name}, GA` : "Henry County, GA"}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setActiveTab("edit")}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200/60 transition flex items-center justify-center gap-2"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Listing Info</span>
              </button>

              <button
                onClick={() => setActiveTab("leads")}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200/60 transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Send direct message</span>
              </button>

              {activeBusiness?.slug && (
                <Link
                  href={`/listings/${activeBusiness.slug}`}
                  target="_blank"
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200/60 transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Public Listing</span>
                </Link>
              )}
            </div>
          </div>

          {/* Glossy Red Credit Card Graphic Widget */}
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
                    H
                  </div>
                  <span>HENRY DIRECTORY</span>
                </div>
              </div>

              <div className="z-10 text-center tracking-widest font-mono text-sm sm:text-base font-semibold text-white/90 drop-shadow-xs">
                ••••  ••••  ••••  {activeBusiness?.id ? String(activeBusiness.id).slice(-4) : "0007"}
              </div>

              <div className="flex justify-between items-end z-10 text-xs">
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-white/70 font-semibold">Card Holder</div>
                  <div className="font-bold tracking-wide truncate max-w-[120px] uppercase text-white text-[11px]">
                    {activeBusiness?.name || userProfile?.full_name || "G. Vella"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] uppercase tracking-wider text-white/70 font-semibold">Plan / Status</div>
                  <div className="font-bold tracking-wide uppercase text-white text-[11px]">
                    {activeBusiness?.plan_tier ? `${activeBusiness.plan_tier}` : "12/23"}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleManageSubscription}
                disabled={portalLoading}
              className="w-full text-center text-xs font-bold text-[#E8505B] hover:text-[#CF3641] transition-colors py-1 flex items-center justify-center gap-1.5 group cursor-pointer"
            >
              <span>{portalLoading ? "Loading Portal..." : "Manage Subscription & Billing"}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </aside>
      </div>
    </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">Confirm Logout</h3>
            <p className="text-sm text-slate-500 mb-6 font-light">Are you sure you want to log out of your dashboard?</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <form action={logout} className="flex-1">
                <button 
                  type="submit"
                  className="w-full px-4 py-2.5 bg-[#E8505B] hover:bg-[#CF3641] text-white font-bold text-xs rounded-xl transition-colors uppercase tracking-wider"
                >
                  Log Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
