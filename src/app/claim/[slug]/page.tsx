"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendOTPAction, verifyOTPAction, submitFallbackClaimAction } from "../actions";
import { CircleCheck, ShieldAlert, Phone, Mail, FileText, Send, Check } from "lucide-react";

// Helper to mask email for security
function maskEmail(email: string): string {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const maskedName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`;
  const [domainName, domainExt] = domain.split(".");
  const maskedDomain = domainName.length > 2 ? `${domainName.slice(0, 2)}***` : `${domainName}***`;
  return `${maskedName}@${maskedDomain}.${domainExt || "com"}`;
}

// Helper to mask phone for security
function maskPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  return `${cleaned.slice(0, 3)}-***-**${cleaned.slice(-2)}`;
}

interface ClaimDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ClaimDetailPage({ params }: ClaimDetailPageProps) {
  const { slug } = use(params);

  const [business, setBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Verification step states
  const [selectedChannel, setSelectedChannel] = useState<"email" | "phone">("email");
  const [targetValue, setTargetValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  
  // Alert/Status states
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const [claimSuccess, setClaimSuccess] = useState(false);

  // Fallback form states
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [fallbackSuccess, setFallbackSuccess] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadData() {
      // 1. Get user session
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // 2. Fetch business
      const { data: bus, error } = await supabase
        .from("businesses")
        .select("id, name, slug, email, phone, status, address")
        .eq("slug", slug)
        .single();

      setLoading(false);
      if (!error && bus) {
        setBusiness(bus);
      }
    }
    loadData();
  }, [slug, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
        <Header />
        <div className="text-center py-12">Loading details...</div>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
        <Header />
        <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-brandRed mx-auto" />
          <h1 className="text-xl font-bold text-brandText-dark font-heading">Listing Not Found</h1>
          <p className="text-sm text-brandText-light">This listing could not be found or has been removed.</p>
          <Link href="/claim" className="inline-block text-sm font-bold text-brandRed hover:underline">
            Go back to search
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // If business is already claimed
  if (business.status === "claimed" && !claimSuccess) {
    return (
      <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
        <Header />
        <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <CircleCheck className="h-12 w-12 text-badge-verified mx-auto" />
          <h1 className="text-xl font-bold text-brandText-dark font-heading">Already Claimed</h1>
          <p className="text-sm text-brandText-light">
            &ldquo;{business.name}&rdquo; is already a verified listing. If this is a mistake, contact administration.
          </p>
          <Link href="/claim" className="inline-block text-sm font-bold text-brandRed hover:underline">
            Claim another business
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
        <Header />
        <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-brandRed mx-auto" />
          <h1 className="text-xl font-bold text-brandText-dark font-heading">Authentication Required</h1>
          <p className="text-sm text-brandText-light">
            You must be logged in to claim ownership of &ldquo;{business.name}&rdquo;. Please sign in or register first.
          </p>
          <div className="flex justify-center space-x-4 pt-2">
            <Link
              href={`/auth/login?redirectTo=/claim/${business.slug}`}
              className="bg-brandRed text-white text-xs font-bold px-4 py-2 rounded-btn hover:bg-brandRed-hover transition shadow-sm"
            >
              LOG IN
            </Link>
            <Link
              href="/auth/signup"
              className="border border-brandBorder-light text-brandText-dark text-xs font-bold px-4 py-2 rounded-btn hover:bg-slate-50 transition"
            >
              SIGN UP
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 1. Handle trigger OTP action
  const handleSendOTP = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    setOtpLoading(true);

    const res = await sendOTPAction(business.id, selectedChannel);
    setOtpLoading(false);

    if (res?.error) {
      setOtpError(res.error);
    } else if (res?.success) {
      setOtpSuccess(res.success);
      setOtpSent(true);
      if (res.targetValue) {
        setTargetValue(res.targetValue);
      }
    }
  };

  // 2. Handle verification submission
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setOtpSuccess(null);
    setOtpLoading(true);

    const res = await verifyOTPAction(business.id, targetValue, otpCode);
    setOtpLoading(false);

    if (res?.error) {
      setOtpError(res.error);
    } else if (res?.success) {
      setOtpSuccess(res.success);
      setClaimSuccess(true);
    }
  };

  // 3. Handle fallback review submission
  const handleFallbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFallbackError(null);
    setFallbackSuccess(null);
    setFallbackLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const notes = formData.get("notes") as string;

    const res = await submitFallbackClaimAction(business.id, fullName, phone, email, notes);
    setFallbackLoading(false);

    if (res?.error) {
      setFallbackError(res.error);
    } else if (res?.success) {
      setFallbackSuccess(res.success);
      setClaimSuccess(true);
    }
  };

  // 4. Success State display
  if (claimSuccess) {
    return (
      <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
        <Header />
        <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <div className="h-14 w-14 bg-emerald-50 text-badge-verified border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-brandText-dark font-heading">Congratulations!</h1>
          <p className="text-sm text-brandText-medium leading-relaxed">
            Your claim registration for &ldquo;{business.name}&rdquo; is now active.
            {fallbackSuccess
              ? " Your request is pending admin review, but you have been granted soft-claim access to edit details immediately."
              : " You are now the verified owner."}
          </p>
          <div className="flex justify-center space-x-4 pt-2">
            <Link
              href="/dashboard"
              className="bg-brandRed text-white text-xs font-bold px-4 py-2 rounded-btn hover:bg-brandRed-hover transition shadow-sm"
            >
              GO TO DASHBOARD
            </Link>
            <Link
              href={`/listings/${business.slug}`}
              className="border border-brandBorder-light text-brandText-dark text-xs font-bold px-4 py-2 rounded-btn hover:bg-slate-50 transition"
            >
              VIEW LISTING
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
      <Header />

      <main className="flex-grow py-12 px-4">
        <div className="mx-auto max-w-xl">
          {/* Business Info header */}
          <div className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm mb-6 text-center">
            <span className="text-[10px] font-bold text-brandRed uppercase tracking-wider bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-btn mb-2 inline-block">
              Unclaimed Listing
            </span>
            <h1 className="text-2xl font-extrabold text-brandText-dark font-heading leading-tight mb-2">
              Claim &ldquo;{business.name}&rdquo;
            </h1>
            <p className="text-xs text-brandText-light leading-relaxed">
              Address: {business.address || "No address listed"}
            </p>
          </div>

          {/* Verification section */}
          {!showFallback ? (
            <div className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-6">
              <h2 className="text-base font-bold text-brandText-dark font-heading flex items-center">
                <CircleCheck className="h-5 w-5 text-brandRed mr-2" />
                <span>Verify Contact Ownership</span>
              </h2>
              <p className="text-xs text-brandText-light leading-relaxed">
                Choose a channel to receive your 6-digit Verification OTP code to authenticate ownership.
              </p>

              {/* Channel Selector */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedChannel("email")}
                  disabled={!business.email}
                  className={`flex flex-col items-center justify-center p-4 rounded-btn border text-center transition-all ${
                    selectedChannel === "email"
                      ? "border-brandRed bg-red-50/20 text-brandRed font-bold"
                      : "border-brandBorder-light bg-white text-brandText-medium hover:bg-slate-50"
                  } ${!business.email ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <Mail className="h-5 w-5 mb-2" />
                  <span className="text-xs font-semibold">Email</span>
                  <span className="text-[10px] font-light mt-1 text-brandText-light">
                    {business.email ? maskEmail(business.email) : "No email listed"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel("phone")}
                  disabled={!business.phone}
                  className={`flex flex-col items-center justify-center p-4 rounded-btn border text-center transition-all ${
                    selectedChannel === "phone"
                      ? "border-brandRed bg-red-50/20 text-brandRed font-bold"
                      : "border-brandBorder-light bg-white text-brandText-medium hover:bg-slate-50"
                  } ${!business.phone ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <Phone className="h-5 w-5 mb-2" />
                  <span className="text-xs font-semibold">SMS Text</span>
                  <span className="text-[10px] font-light mt-1 text-brandText-light">
                    {business.phone ? maskPhone(business.phone) : "No phone listed"}
                  </span>
                </button>
              </div>

              {/* Trigger OTP */}
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={otpLoading || (!business.email && !business.phone)}
                  className="w-full bg-brandRed hover:bg-brandRed-hover text-white text-sm font-bold p-3 rounded-btn shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="h-4.5 w-4.5" />
                  <span>{otpLoading ? "Sending OTP..." : "Send Verification Code"}</span>
                </button>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4 border-t border-brandBorder-light pt-6">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-dark mb-1">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full p-3 text-center text-lg font-bold border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed letter-spacing-wide bg-slate-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full bg-brandRed hover:bg-brandRed-hover text-white text-sm font-bold p-3 rounded-btn shadow-sm transition disabled:opacity-50"
                  >
                    {otpLoading ? "Verifying..." : "Verify OTP & Claim Listing"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-xs text-brandText-medium hover:text-brandRed font-semibold block text-center mx-auto"
                  >
                    Resend Code
                  </button>
                </form>
              )}

              {otpError && (
                <div className="p-3 text-xs text-brandRed bg-brandRed-muted rounded-btn border border-brandRed/25">
                  {otpError}
                </div>
              )}

              {otpSuccess && (
                <div className="p-3 text-xs text-badge-verified bg-emerald-50 rounded-btn border border-badge-verified/25">
                  {otpSuccess}
                </div>
              )}

              {/* Fallback channel link */}
              <div className="border-t border-brandBorder-light pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowFallback(true)}
                  className="text-xs font-semibold text-brandText-medium hover:text-brandRed underline"
                >
                  Don&apos;t have access to this email or phone? Request admin review
                </button>
              </div>
            </div>
          ) : (
            /* Fallback Admin Review Queue form */
            <div className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-4">
              <h2 className="text-base font-bold text-brandText-dark font-heading flex items-center">
                <FileText className="h-5 w-5 text-brandRed mr-2" />
                <span>Request Admin Review</span>
              </h2>
              <p className="text-xs text-brandText-light leading-relaxed">
                If the phone or email on file is incorrect, upload details supporting your claim.
                An administrator will review your application. In the meantime, you get **soft-claim** access to edit details immediately.
              </p>

              <form onSubmit={handleFallbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-brandText-medium mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="Enter your name..."
                    className="w-full p-2.5 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brandText-medium mb-1">
                      Business Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="you@company.com"
                      className="w-full p-2.5 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brandText-medium mb-1">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="770-555-0100"
                      className="w-full p-2.5 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-brandText-medium mb-1">
                    Notes / Verification proof (e.g. website link, license description)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Provide details proving you own this business..."
                    className="w-full p-2.5 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed"
                  />
                </div>

                {fallbackError && (
                  <div className="p-3 text-xs text-brandRed bg-brandRed-muted rounded-btn border border-brandRed/20">
                    {fallbackError}
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={fallbackLoading}
                    className="w-full bg-brandRed hover:bg-brandRed-hover text-white text-sm font-bold p-3 rounded-btn shadow-sm transition disabled:opacity-50"
                  >
                    {fallbackLoading ? "Submitting..." : "Submit Claim Request"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFallback(false)}
                    className="w-full border border-brandBorder-light text-brandText-dark text-sm font-semibold p-3 rounded-btn hover:bg-slate-50 transition"
                  >
                    Back to OTP
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
