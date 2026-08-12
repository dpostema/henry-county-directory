/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { siteConfig } from "@/config/site";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Heart, 
  Star, 
  Clock, 
  Settings,
  ArrowRight,
  LogOut,
  Building2,
  MapPin,
  Save,
  CheckCircle2,
  Menu,
  X,
  Camera,
  User
} from "lucide-react";
import { logout } from "../auth/actions";
import { updateProfileAction, updateAvatarAction } from "./actions";

interface VisitorDashboardProps {
  userProfile: any;
  favorites: any[];
  reviews: any[];
}

export default function VisitorDashboard({ userProfile, favorites, reviews }: VisitorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"favorites" | "reviews" | "history" | "settings">("favorites");
  const [history, setHistory] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Settings Form State
  const [fullName, setFullName] = useState(userProfile?.full_name || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatar_url || null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check onboarding status
    try {
      const hasSeen = localStorage.getItem(`onboarding_completed_${userProfile?.id}`);
      if (!hasSeen) {
        setShowWelcomeModal(true);
      }
    } catch (e) {
      console.error("Could not read localStorage for onboarding", e);
    }

    // Load history from local storage
    try {
      const stored = localStorage.getItem("recent_history");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Could not load history", e);
    }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const res = await updateProfileAction(fullName);
      if (res?.error) throw new Error(res.error);
      
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const avatarRes = await updateAvatarAction(formData);
        if (avatarRes?.error) throw new Error(avatarRes.error);
        if (avatarRes?.avatarUrl) {
          setAvatarPreview(avatarRes.avatarUrl);
          setAvatarFile(null); // Clear pending file
        }
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const navItems = [
    { id: "favorites", label: "Saved Places", icon: Heart },
    { id: "reviews", label: "My Reviews", icon: Star },
    { id: "history", label: "Recently Viewed", icon: Clock },
    { id: "settings", label: "Profile Settings", icon: Settings },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case "favorites":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-brandText-dark font-heading tracking-tight mb-2">Saved Places</h2>
              <p className="text-sm text-brandText-medium font-light">Businesses you have saved for later.</p>
            </div>
            
            {favorites.length === 0 ? (
              <div className="bg-brandBg-card rounded-xl p-12 text-center border border-brandBorder-light shadow-sm">
                <Heart className="h-12 w-12 text-brandText-light mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-brandText-dark font-heading">No Saved Places</h3>
                <p className="text-sm text-brandText-medium mt-2 max-w-sm mx-auto font-light">
                  When you find a business you like, click the heart icon to save it here.
                </p>
                <Link href="/" className="mt-6 inline-flex items-center justify-center bg-brandRed text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-sm hover:bg-brandRed-hover transition-colors">
                  Explore Directory
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((fav) => {
                  const b = fav.businesses;
                  if (!b) return null;
                  return (
                    <Link key={fav.id} href={`/listings/${b.slug}`} className="group block">
                      <div className="bg-brandBg-card border border-brandBorder-light rounded-xl overflow-hidden hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                        {b.cover_image_url ? (
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                            <Image
                              src={b.cover_image_url}
                              alt={b.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                            <div className="absolute top-3 right-3 h-8 w-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-brandRed shadow-sm">
                              <Heart className="h-4 w-4 fill-current" />
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[4/3] w-full bg-slate-100 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-brandText-light opacity-30" />
                          </div>
                        )}
                        <div className="p-4 flex-grow flex flex-col">
                          <h3 className="font-bold text-brandText-dark group-hover:text-brandRed transition-colors truncate">
                            {b.name}
                          </h3>
                          <div className="flex items-center text-xs text-brandText-medium mt-1 font-light">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{b.city?.name || "Local Area"}</span>
                            <span className="mx-2 text-brandBorder-light">•</span>
                            <span className="truncate">{b.category?.name || "Uncategorized"}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "reviews":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-brandText-dark font-heading tracking-tight mb-2">My Reviews</h2>
              <p className="text-sm text-brandText-medium font-light">Reviews you have left for local businesses.</p>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-brandBg-card rounded-xl p-12 text-center border border-brandBorder-light shadow-sm">
                <Star className="h-12 w-12 text-brandText-light mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-brandText-dark font-heading">No Reviews Yet</h3>
                <p className="text-sm text-brandText-medium mt-2 max-w-sm mx-auto font-light">
                  Help the community by leaving reviews for businesses you&apos;ve visited.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const b = review.businesses;
                  return (
                    <div key={review.id} className="bg-brandBg-card p-5 rounded-xl border border-brandBorder-light shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Link href={b ? `/listings/${b.slug}` : "#"} className="font-bold text-brandText-dark hover:text-brandRed transition-colors">
                            {b?.name || "Unknown Business"}
                          </Link>
                          <div className="text-xs text-brandText-light mt-0.5">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="ml-1 text-sm font-bold">{review.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-sm text-brandText-medium font-light leading-relaxed whitespace-pre-wrap">
                        {review.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "history":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-brandText-dark font-heading tracking-tight mb-2">Recently Viewed</h2>
                <p className="text-sm text-brandText-medium font-light">Businesses you have looked at recently on this device.</p>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={() => { localStorage.removeItem("recent_history"); setHistory([]); }}
                  className="text-xs font-bold text-brandText-light hover:text-brandRed transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-brandBg-card rounded-xl p-12 text-center border border-brandBorder-light shadow-sm">
                <Clock className="h-12 w-12 text-brandText-light mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-brandText-dark font-heading">No Recent History</h3>
                <p className="text-sm text-brandText-medium mt-2 max-w-sm mx-auto font-light">
                  Businesses you view will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {history.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/listings/${item.slug}`}
                    className="group flex flex-col bg-brandBg-card border border-brandBorder-light rounded-xl overflow-hidden hover:border-brandRed hover:shadow-md transition-all duration-200"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-28 w-full overflow-hidden bg-slate-100 flex-shrink-0">
                      {item.cover_image_url ? (
                        <Image
                          src={item.cover_image_url}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                      ) : (
                        /* Fallback: generated avatar based on business name */
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}&backgroundColor=e8505b&fontSize=36&fontWeight=700&textColor=ffffff`}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <h4 className="font-bold text-xs text-brandText-dark truncate group-hover:text-brandRed transition-colors leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-brandText-light mt-0.5">Viewed recently</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-brandText-dark font-heading tracking-tight mb-2">Profile Settings</h2>
              <p className="text-sm text-brandText-medium font-light">Manage your personal information.</p>
            </div>
            
            <div className="max-w-lg bg-brandBg-card rounded-xl border border-brandBorder-light shadow-sm p-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                <div className="flex flex-col items-start mb-2">
                  <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-3">Profile Photo</label>
                  <label htmlFor="avatar-upload" className="relative cursor-pointer group">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-slate-50 group-hover:border-brandRed transition-colors relative">
                      {avatarPreview ? (
                        <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-400 group-hover:text-brandRed transition-colors" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                  <span className="text-[10px] text-brandText-light mt-2 font-medium">Click to change</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    value={userProfile?.email}
                    disabled
                    className="w-full px-4 py-2 border border-brandBorder-light bg-slate-50 text-brandText-medium rounded-lg text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-brandText-light mt-1">Email cannot be changed directly.</p>
                </div>
                
                <div className="pt-4 border-t border-brandBorder-light flex items-center justify-between">
                  <div>
                    {saveStatus === "success" && (
                      <span className="flex items-center text-emerald-600 text-xs font-bold animate-in fade-in">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Saved
                      </span>
                    )}
                    {saveStatus === "error" && (
                      <span className="text-brandRed text-xs font-bold animate-in fade-in">Failed to save</span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={saveStatus === "saving"}
                    className="flex items-center bg-brandRed text-white px-5 py-2 rounded-full font-bold text-xs shadow-sm hover:bg-brandRed-hover transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveStatus === "saving" ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between font-body text-slate-700">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <Image 
            src="/logo.svg" 
            alt={`${siteConfig.name} Logo`}
            width={28} 
            height={28} 
            className="object-contain" 
          />
          <span className="font-heading font-black text-lg text-slate-900 tracking-tight">{siteConfig.name}</span>
        </Link>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -mr-2 text-slate-700 rounded-lg hover:bg-slate-50">
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Workspace Container */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR NAV */}
          <aside className={`
            ${isSidebarOpen ? 'block' : 'hidden md:block'}
            lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-6
          `}>
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
                  Member Portal
                </span>
              </div>
            </div>

            {/* Nav Items */}
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                User Dashboard
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                      isActive 
                        ? "bg-[#E8505B] text-white shadow-md shadow-red-500/20" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-3 ${isActive ? "text-white" : "text-slate-400"}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Sidebar Actions & Profile */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-[#E8505B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {(userProfile?.full_name || "V")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {userProfile?.full_name || "Visitor User"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {userProfile?.email || "Member Account"}
                  </p>
                </div>
              </div>

              <Link 
                href="/claim" 
                className="flex items-center justify-between w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl hover:border-[#E8505B] hover:shadow-xs transition group text-xs font-bold text-slate-800"
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Own a Business?</p>
                  <p className="text-[10px] text-slate-400 font-medium">Claim listing</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#E8505B] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <div className="flex gap-2">
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition"
                >
                  <span>Website</span>
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

          {/* CENTER CONTENT PANE */}
          <main className="lg:col-span-6 space-y-6">
            {renderContent()}
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
                    {(userProfile?.full_name || "V")[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 font-heading">
                  {userProfile?.full_name || "Community Member"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Henry County, GA
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setActiveTab("favorites")}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200/60 transition flex items-center justify-center gap-2"
                >
                  <Heart className="w-3.5 h-3.5 text-slate-500" />
                  <span>Saved Places ({favorites.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200/60 transition flex items-center justify-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Profile Settings</span>
                </button>
              </div>
            </div>

            {/* Glossy Red Member Card Graphic Widget */}
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
                  ••••  ••••  ••••  2026
                </div>

                <div className="flex justify-between items-end z-10 text-xs">
                  <div>
                    <div className="text-[8px] uppercase tracking-wider text-white/70 font-semibold">Member Name</div>
                    <div className="font-bold tracking-wide truncate max-w-[120px] uppercase text-white text-[11px]">
                      {userProfile?.full_name || "Community Member"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] uppercase tracking-wider text-white/70 font-semibold">Card Status</div>
                    <div className="font-bold tracking-wide uppercase text-white text-[11px]">
                      ACTIVE PASS
                    </div>
                  </div>
                </div>
              </div>

              <Link 
                href="/"
                className="w-full text-center text-xs font-bold text-[#E8505B] hover:text-[#CF3641] transition-colors py-1 flex items-center justify-center gap-1.5 group cursor-pointer"
              >
                <span>Explore Local Directory</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Welcome Onboarding Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">
            {/* Header Art */}
            <div className="bg-brandRed/5 pt-8 pb-6 px-6 flex justify-center border-b border-brandRed/10 relative">
              <div className="flex flex-col items-center gap-3">
                <Image 
                  src="/logo.svg" 
                  alt={`${siteConfig.name} Logo`} 
                  width={48} 
                  height={48} 
                  className="object-contain" 
                />
              </div>
              <button 
                onClick={() => {
                  setShowWelcomeModal(false);
                  localStorage.setItem(`onboarding_completed_${userProfile?.id}`, "true");
                }}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/50 flex items-center justify-center text-brandText-medium hover:bg-white hover:text-brandText-dark transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold font-heading text-brandText-dark mb-2">
                Welcome to Henry County Directory!
              </h3>
              <p className="text-sm text-brandText-medium font-light mb-6">
                We're excited to have you here. You can save your favorite local spots, leave reviews, and help the community grow.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    localStorage.setItem(`onboarding_completed_${userProfile?.id}`, "true");
                    setActiveTab("settings");
                  }}
                  className="w-full flex items-center justify-center bg-brandRed text-white py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-brandRed-hover transition-colors gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Complete Your Profile
                </button>
                <Link
                  href="/"
                  onClick={() => {
                    localStorage.setItem(`onboarding_completed_${userProfile?.id}`, "true");
                  }}
                  className="w-full flex items-center justify-center bg-brandBg-card text-brandText-dark py-2.5 rounded-full text-sm font-bold border border-brandBorder-light hover:bg-slate-50 transition-colors gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Explore Directory
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold font-heading text-slate-900 mb-2">Sign Out</h3>
            <p className="text-sm text-slate-500 font-light mb-6">Are you sure you want to end your session?</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <form action={logout} className="flex-1">
                <button 
                  type="submit"
                  className="w-full px-4 py-2 bg-[#E8505B] text-white rounded-full text-xs font-bold shadow-sm hover:bg-[#CF3641] transition-colors uppercase tracking-wider"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
