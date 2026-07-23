"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";

export default function ErrorBoundary({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-brandBg-app flex flex-col font-body">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brandRed-muted mb-6">
            <AlertTriangle className="h-8 w-8 text-brandRed" />
          </div>
          <h1 className="text-2xl font-extrabold text-brandText-dark font-heading mb-3">Something went wrong</h1>
          <p className="text-sm text-brandText-light font-light mb-8 leading-relaxed">
            We encountered an unexpected error. Please try again or return to the homepage.
          </p>

          <div className="space-y-3">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 w-full bg-brandRed hover:bg-brandRed-hover text-white py-3 px-6 rounded-full font-bold text-sm transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 border border-brandBorder-light text-brandText-dark py-3 px-6 rounded-full font-bold text-sm transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Go to Homepage
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
