"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { requestPasswordReset, updatePassword } from "../actions";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function ResetPasswordPage() {
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  const router = useRouter();
  const [code, setCode] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrigin(window.location.origin);
      if (window.location.hash.includes("type=recovery") || window.location.search.includes("code=")) {
        setIsUpdateMode(true);
        const params = new URLSearchParams(window.location.search);
        const c = params.get("code");
        if (c) setCode(c);
      } else {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            router.push("/dashboard");
          }
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  const handleRequestReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("origin", origin);
    const res = await requestPasswordReset(formData);

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(res.success);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await updatePassword(formData);

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(res.success);
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
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-100">
        
        {/* Left Column: Form Pane */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div>
            {/* Header Brand Subtitle */}
            <div className="text-center space-y-1 mb-8">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                ACCOUNT RECOVERY
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
                {isUpdateMode ? "Enter a new password for your account." : "Enter your email to receive a password reset link."}
              </p>
            </div>

            {isUpdateMode ? (
              // Update mode form
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm mx-auto">
                <input type="hidden" name="code" value={code} />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-[#E8505B] focus:ring-2 focus:ring-[#E8505B]/20 transition-all placeholder:text-slate-400 text-slate-900"
                    placeholder="New Password"
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
                  className="w-full bg-[#E8505B] hover:bg-[#CF3641] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-red-500/25 active:scale-[0.99] cursor-pointer"
                >
                  {loading ? "Updating..." : "UPDATE PASSWORD"}
                </button>
              </form>
            ) : (
              // Request reset mode form
              <form onSubmit={handleRequestReset} className="space-y-4 max-w-sm mx-auto">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-[#E8505B] focus:ring-2 focus:ring-[#E8505B]/20 transition-all placeholder:text-slate-400 text-slate-900"
                    placeholder="Email Address"
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
                  className="w-full bg-[#E8505B] hover:bg-[#CF3641] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-red-500/25 active:scale-[0.99] cursor-pointer"
                >
                  {loading ? "Sending..." : "SEND RESET LINK"}
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <Link href="/auth/login" className="text-xs text-[#E8505B] hover:underline font-bold inline-flex items-center gap-1">
              <span>Back to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
