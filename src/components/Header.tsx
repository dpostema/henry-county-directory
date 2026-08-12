"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User, LogOut, Menu, X, ChevronDown, LayoutDashboard } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";

export default function Header({ sticky = true }: { sticky?: boolean } = {}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        setAvatarUrl(currentUser.user_metadata?.avatar_url || null);
        const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', currentUser.id).single();
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      }
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`${sticky ? "sticky top-0" : "relative"} z-50 bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-1.5 group">
              <Image 
                src="/logo.svg" 
                alt={`${siteConfig.name} Logo`} 
                width={28} 
                height={28} 
                className="object-contain transition-transform group-hover:scale-105" 
              />
              <span className="font-heading font-black text-lg text-brandText-dark tracking-tight group-hover:text-brandRed transition-colors">
                {siteConfig.name}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`flex items-center space-x-0.5 px-3 py-2 text-xs font-bold transition-colors tracking-wider uppercase ${pathname === "/" ? "text-brandRed" : "text-brandText-medium hover:text-brandRed"}`}
            >
              <span>Home</span>
            </Link>
            <Link
              href="/listings"
              className={`flex items-center space-x-0.5 px-3 py-2 text-xs font-bold transition-colors tracking-wider uppercase ${pathname === "/listings" ? "text-brandRed" : "text-brandText-medium hover:text-brandRed"}`}
            >
              <span>Explore Listings</span>
            </Link>
            <Link
              href="/help"
              className={`flex items-center space-x-0.5 px-3 py-2 text-xs font-bold transition-colors tracking-wider uppercase ${pathname === "/help" ? "text-brandRed" : "text-brandText-medium hover:text-brandRed"}`}
            >
              <span>Help</span>
            </Link>
            <Link
              href="/blog"
              className={`flex items-center space-x-0.5 px-3 py-2 text-xs font-bold transition-colors tracking-wider uppercase ${pathname === "/blog" ? "text-brandRed" : "text-brandText-medium hover:text-brandRed"}`}
            >
              <span>Blog</span>
            </Link>

            <div className="w-px h-5 bg-brandBorder-light mx-2"></div>

            {user ? (
              <div className="relative ml-1 flex items-center" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-1 focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-100 text-brandText-dark flex items-center justify-center font-bold text-sm border border-brandBorder-light shadow-sm hover:bg-slate-200 transition-colors overflow-hidden relative">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" fill sizes="40px" className="object-cover" />
                    ) : user.email ? (
                      user.email.charAt(0).toUpperCase()
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-brandText-light" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-brandBorder-light rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-4 py-2 border-b border-brandBorder-light mb-1">
                      <p className="text-xs text-brandText-light font-medium truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-brandText-dark hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-brandText-light" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-brandRed hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-brandText-medium hover:text-brandRed transition-colors tracking-wider uppercase"
              >
                <User className="h-3.5 w-3.5" />
                <span>Log in</span>
              </Link>
            )}

            <Link
              href="/add-listing"
              className="ml-2 inline-flex items-center justify-center rounded-full bg-brandRed px-5 py-2 text-xs font-bold text-white hover:bg-brandRed-hover transition-colors shadow-sm tracking-wider uppercase"
            >
              Add Listing
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-brandText-medium hover:text-brandText-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brandRed rounded-sm p-1"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-brandBorder-light py-4 px-6 space-y-1 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${pathname === "/" ? "bg-red-50 text-brandRed" : "text-brandText-medium hover:text-brandRed hover:bg-slate-50"}`}
          >
            Home
          </Link>
          <Link
            href="/listings"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${pathname === "/listings" ? "bg-red-50 text-brandRed" : "text-brandText-medium hover:text-brandRed hover:bg-slate-50"}`}
          >
            Explore Listings
          </Link>
          <Link
            href="/help"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${pathname === "/help" ? "bg-red-50 text-brandRed" : "text-brandText-medium hover:text-brandRed hover:bg-slate-50"}`}
          >
            Help
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${pathname === "/blog" ? "bg-red-50 text-brandRed" : "text-brandText-medium hover:text-brandRed hover:bg-slate-50"}`}
          >
            Blog
          </Link>
          <div className="border-t border-brandBorder-light my-2"></div>
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-brandText-medium hover:text-brandRed hover:bg-slate-50 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="block w-full text-left px-3 py-2.5 text-sm font-semibold text-brandText-medium hover:text-brandRed hover:bg-slate-50 rounded-lg transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-brandText-medium hover:text-brandRed hover:bg-slate-50 rounded-lg transition-colors"
            >
              Log in
            </Link>
          )}
          <Link
            href="/add-listing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center rounded-full bg-brandRed py-2.5 text-sm font-bold text-white hover:bg-brandRed-hover transition-colors shadow-sm mt-2"
          >
            Add Listing
          </Link>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4 border border-brandBorder-light animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-brandText-dark font-heading mb-2">Confirm Logout</h3>
            <p className="text-sm text-brandText-medium mb-6 font-light">Are you sure you want to log out of your account?</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-brandText-dark font-bold text-xs rounded-btn transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <form action={logout} className="flex-1">
                <button 
                  type="submit"
                  className="w-full px-4 py-2.5 bg-brandRed hover:bg-brandRed-hover text-white font-bold text-xs rounded-btn transition-colors uppercase tracking-wider"
                >
                  Log Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
