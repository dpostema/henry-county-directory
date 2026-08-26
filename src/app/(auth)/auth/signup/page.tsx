"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Store, UserCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function SignupSelectionPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-body">
      {/* Decorative Ambient Background Shapes */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#E8505B]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#E8505B]/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Image 
              src="/logo.svg" 
              alt={`${siteConfig.name} Logo`} 
              width={56} 
              height={56} 
              className="mx-auto"
            />
          </Link>
          <div>
            <h1 className="text-3xl font-black font-heading tracking-tight text-slate-900 mb-2">
              Join {siteConfig.name}
            </h1>
            <p className="text-slate-500 font-light max-w-sm mx-auto">
              How would you like to use our directory? Choose the option that best describes you.
            </p>
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
          {/* Visitor Card */}
          <Link 
            href="/auth/signup/visitor"
            className="group relative bg-white border border-slate-200 rounded-3xl p-6 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer overflow-hidden flex flex-col items-start h-full"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10 group-hover:bg-indigo-500/10 transition-colors" />
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">I am a Visitor</h2>
            <p className="text-sm text-slate-500 flex-grow">
              I want to discover local businesses, save my favorite spots, and leave reviews.
            </p>
            <div className="mt-6 text-xs font-bold text-indigo-600 flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              Sign Up as Visitor &rarr;
            </div>
          </Link>

          {/* Business Owner Card */}
          <Link 
            href="/auth/signup/business"
            className="group relative bg-white border border-slate-200 rounded-3xl p-6 hover:border-[#E8505B] hover:shadow-xl hover:shadow-[#E8505B]/10 transition-all cursor-pointer overflow-hidden flex flex-col items-start h-full"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8505B]/5 rounded-bl-full -z-10 group-hover:bg-[#E8505B]/10 transition-colors" />
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E8505B] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">I am a Business Owner</h2>
            <p className="text-sm text-slate-500 flex-grow">
              I want to claim my listing, manage my business profile, and connect with customers.
            </p>
            <div className="mt-6 text-xs font-bold text-[#E8505B] flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              Sign Up as Business &rarr;
            </div>
          </Link>
        </div>

        <div className="text-sm text-slate-500 font-medium">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-slate-900 hover:underline font-bold">
            Sign In Now
          </Link>
        </div>
      </div>
    </div>
  );
}
