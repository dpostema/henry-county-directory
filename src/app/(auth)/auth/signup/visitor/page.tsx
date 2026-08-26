"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signup } from "../../actions";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User, Eye, EyeOff, Globe, Share2, AtSign, MessageCircle, Camera, ArrowLeft } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function VisitorSignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("origin", window.location.origin);
    const res = await signup(formData);

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
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10 border border-slate-100 min-h-[620px]">
        
        {/* Left Column: Form Pane */}
        <div className="p-8 sm:p-10 flex flex-col justify-between relative">
          <Link href="/auth/signup" className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="mt-6">
            {/* Header Brand Subtitle */}
            <div className="text-center space-y-1 mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                JOIN AS A VISITOR
              </span>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-black font-heading tracking-tight text-slate-900">
                  Welcome to {siteConfig.name}
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-light mt-1 max-w-xs mx-auto">
                Create your account to discover local listings, save your favorites, and leave reviews.
              </p>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 max-w-sm mx-auto">
              <input type="hidden" name="role" value="visitor" />
              
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-4">
                <label htmlFor="avatar" className="relative cursor-pointer group">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-slate-50 group-hover:border-[#E8505B] transition-colors relative">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt="Avatar Preview" fill sizes="80px" className="object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400 group-hover:text-[#E8505B] transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
                <span className="text-[10px] text-slate-500 mt-1.5 font-medium uppercase tracking-wider">Profile Photo (Optional)</span>
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  required
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-[#E8505B] focus:ring-2 focus:ring-[#E8505B]/20 transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="Full Name"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-[#E8505B] focus:ring-2 focus:ring-[#E8505B]/20 transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="Email Address"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full pl-11 pr-11 py-2.5 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-[#E8505B] focus:ring-2 focus:ring-[#E8505B]/20 transition-all placeholder:text-slate-400 text-slate-900"
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
                className="w-full bg-[#E8505B] hover:bg-[#CF3641] text-white py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-red-500/25 active:scale-[0.99] cursor-pointer mt-1"
              >
                {loading ? "Creating Account..." : "CREATE VISITOR ACCOUNT"}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-slate-500 font-medium">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#E8505B] hover:underline font-bold">
                Sign In Now
              </Link>
            </div>
          </div>

          {/* Social Divider & Icons */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2 mt-4">
            <div className="relative flex items-center justify-center max-w-xs mx-auto">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
                Or
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-medium pt-1">Continue with social media</p>

            <div className="flex items-center justify-center gap-3">
              {[
                { icon: Globe, label: "Google" },
                { icon: Share2, label: "Share" },
                { icon: AtSign, label: "Email" },
                { icon: MessageCircle, label: "Chat" },
              ].map((soc, i) => {
                const Icon = soc.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => alert(`Sign up with ${soc.label} active.`)}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#E8505B] hover:border-[#E8505B] hover:bg-red-50/50 transition-all cursor-pointer shadow-xs"
                    title={soc.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Hero Graphic Pane */}
        <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-900 text-white p-8 sm:p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
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
                Discover Local Favorites
              </h2>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                Join our community to find the best local businesses, save your favorite spots, and share your experiences.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white opacity-40" />
              <span className="w-2 h-2 rounded-full bg-white opacity-100" />
              <span className="w-2 h-2 rounded-full bg-white opacity-40" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
