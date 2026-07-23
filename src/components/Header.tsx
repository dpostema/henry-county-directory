"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { User as SupabaseUser } from "@supabase/supabase-js";

export default function Header({ sticky = true }: { sticky?: boolean } = {}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
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
                alt="Henry County Directory Logo" 
                width={28} 
                height={28} 
                className="object-contain transition-transform group-hover:scale-105" 
              />
              <span className="font-heading font-black text-lg text-brandText-dark tracking-tight group-hover:text-brandRed transition-colors">
                Henry<span className="text-brandRed">County</span>Directory
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
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-brandText-medium hover:text-brandRed transition-colors tracking-wider uppercase"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-brandText-medium hover:text-brandRed transition-colors tracking-wider uppercase"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log out</span>
                </button>
              </>
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
