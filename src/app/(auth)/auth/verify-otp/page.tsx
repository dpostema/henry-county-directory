"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Mail, KeyRound, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
export default function VerifyOtpPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email,
            action: "send",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send OTP.");
      }

      setSuccess("OTP sent successfully! Check your email inbox.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email,
            code,
            action: "verify",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed.");
      }

      setSuccess("OTP Verified successfully! Code is valid.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-body">
      {/* Decorative Ambient Background Shapes */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#E8505B]/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#E8505B]/15 blur-2xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#E8505B] rounded-br-full opacity-90 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#E8505B] rounded-tl-full opacity-90 pointer-events-none hidden sm:block" />

      {/* Floating Split Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10 border border-slate-100 min-h-[580px]">
        
        {/* Left Column: Form Pane */}
        <div className="p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Header Brand Subtitle */}
            <div className="text-center space-y-1 mb-8">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                SECURITY AUTHENTICATION
              </span>
              <div className="flex items-center justify-center gap-2">
                <Link href="/" className="flex items-center gap-2 group">
                  <Image 
                    src="/logo.svg" 
                    alt={`${siteConfig.name} Logo`} 
                    width={32} 
                    height={32} 
                    className="object-contain transition-transform group-hover:scale-105" 
                  />
                  <h1 className="text-xl font-black font-heading tracking-tight text-slate-900">
                    {siteConfig.name}
                  </h1>
                </Link>
              </div>
              <p className="text-xs text-slate-500 font-light mt-2 max-w-xs mx-auto">
                Request and verify one-time passcodes for authentication.
              </p>
            </div>

            {/* Step 1: Send OTP Form */}
            <form onSubmit={handleSendOtp} className="space-y-3 max-w-sm mx-auto mb-6 pb-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Step 1: Request OTP</span>
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-[#E8505B] focus:ring-2 focus:ring-[#E8505B]/20 transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="Email Address"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Sending..." : "Request Passcode"}
              </button>
            </form>

            {/* Step 2: Verify OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-3 max-w-sm mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Step 2: Enter Code</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-full text-xs font-bold focus:outline-none focus:border-[#E8505B] focus:ring-2 focus:ring-[#E8505B]/20 tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal"
                  placeholder="6-Digit OTP Code"
                />
              </div>

              {error && (
                <div className="p-3 text-xs text-[#E8505B] bg-red-50 rounded-xl border border-red-100 font-medium text-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 text-xs text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 font-medium text-center">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E8505B] hover:bg-[#CF3641] text-white py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-red-500/25 active:scale-[0.99] cursor-pointer"
              >
                {loading ? "Verifying..." : "VERIFY PASSCODE"}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <Link href="/auth/login" className="text-xs text-[#E8505B] hover:underline font-bold inline-flex items-center gap-1">
              <span>Back to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Hero Graphic Pane */}
        <div className="bg-gradient-to-br from-[#E8505B] via-[#D93845] to-[#991B1B] text-white p-8 sm:p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
          {/* Subtle Ambient Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-xs space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto shadow-xl p-3">
              <Image 
                src="/logo.svg" 
                alt={`${siteConfig.name} Logo`} 
                width={52} 
                height={52} 
                className="object-contain" 
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black font-heading tracking-tight text-white drop-shadow-sm">
                {siteConfig.name}
              </h2>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                Enter your 6-digit email passcode to securely verify account ownership and authorization.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white opacity-40" />
              <span className="w-2 h-2 rounded-full bg-white opacity-40" />
              <span className="w-2 h-2 rounded-full bg-white opacity-100" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
