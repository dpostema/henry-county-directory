"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { login } from "../actions";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, Globe, Share2, AtSign, MessageCircle, ArrowLeft } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await login(formData);

    if (res?.error) {
      setError(res.error);
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
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-100">
        
        {/* Left Column: Form Pane */}
        <div className="p-8 sm:p-12 flex flex-col justify-center relative">
          <button onClick={() => router.back()} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          <div className="mt-6">
            {/* Header Brand Subtitle */}
            <div className="text-center space-y-1 mb-8">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                WELCOME TO
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
                Log in to get in-the-moment updates on local businesses and listings.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-[#E8505B] focus:ring-2 focus:ring-[#E8505B]/20 transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="Email Address"
                />
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-[#E8505B] focus:ring-2 focus:ring-[#E8505B]/20 transition-all placeholder:text-slate-400 text-slate-900"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="text-right mt-1.5 pr-2">
                  <Link href="/auth/reset-password" className="text-[11px] text-[#E8505B] hover:underline font-bold">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs text-[#E8505B] bg-red-50 rounded-xl border border-red-100 font-medium text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E8505B] hover:bg-[#CF3641] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-red-500/25 active:scale-[0.99] cursor-pointer"
              >
                {loading ? "Signing In..." : "SIGN IN"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500 font-medium">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-[#E8505B] hover:underline font-bold">
                Sign Up Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
