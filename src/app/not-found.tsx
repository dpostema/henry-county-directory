"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, MapPin, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brandBg-app flex flex-col font-body">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brandRed-muted mb-6">
            <span className="text-4xl font-black text-brandRed font-heading">404</span>
          </div>
          <h1 className="text-2xl font-extrabold text-brandText-dark font-heading mb-3">Page Not Found</h1>
          <p className="text-sm text-brandText-light font-light mb-8 leading-relaxed">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
          </p>

          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full bg-brandRed hover:bg-brandRed-hover text-white py-3 px-6 rounded-full font-bold text-sm transition-colors shadow-sm"
            >
              <Search className="w-4 h-4" />
              Search Henry County
            </Link>
            <Link
              href="/category/foods"
              className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 border border-brandBorder-light text-brandText-dark py-3 px-6 rounded-full font-bold text-sm transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Browse Local Foods
            </Link>
            <div className="pt-3">
              <Link href="/" className="text-xs font-bold text-brandRed hover:underline flex items-center justify-center gap-1">
                <span>Return Home</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
