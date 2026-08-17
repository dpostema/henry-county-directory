"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { optInDigestAction } from "@/app/(public)/listings/actions";
import { siteConfig } from "@/config/site";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const res = await optInDigestAction(email, ["newsletter"]);
    if (res.success) {
      setSubscribed(true);
      setEmail("");
      alert(res.success);
    } else if (res.error) {
      alert(res.error);
    }
  };

  return (
    <footer className="bg-white text-brandText-medium border-t border-brandBorder-light font-body">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-1.5 group">
              <Image 
                src="/logo.svg" 
                alt={`${siteConfig.name} Logo`} 
                width={32} 
                height={32} 
                className="object-contain transition-transform group-hover:scale-105" 
              />
              <span className="text-lg font-extrabold text-brandText-dark tracking-tight font-heading group-hover:text-brandRed transition-colors">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-sm text-brandText-light font-light leading-relaxed">
              {siteConfig.footer.about}
            </p>
            <div className="text-xs text-brandText-light font-medium">
              {siteConfig.footer.addressLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < siteConfig.footer.addressLines.length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-[11px] font-bold text-brandText-dark uppercase tracking-wider mb-4 font-heading">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="#" className="hover:text-brandRed transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-brandRed transition-colors">
                  Team
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-brandRed transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-brandRed transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-[11px] font-bold text-brandText-dark uppercase tracking-wider mb-4 font-heading">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="#" className="hover:text-brandRed transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-brandRed transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-brandRed transition-colors">
                  Sitemap
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-brandRed transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <h4 className="text-[11px] font-bold text-brandText-dark uppercase tracking-wider mb-4 font-heading">
              Our Newsletter
            </h4>
            <p className="text-sm text-brandText-light font-light mb-4 leading-relaxed">
              Subscribe to our newsletter to receive the latest updates, listings, and promotions.
            </p>
            {subscribed ? (
              <p className="text-xs text-badge-verified font-bold bg-emerald-50 border border-badge-verified/20 rounded-full px-3 py-1.5 inline-block">
                Subscribed successfully! Thank you.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex max-w-sm rounded-full overflow-hidden border border-brandBorder-light bg-slate-50 focus-within:border-brandRed focus-within:ring-1 focus-within:ring-brandRed transition-all shadow-sm">
                <input
                  suppressHydrationWarning
                  type="email"
                  placeholder="Email Address..."
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-transparent text-sm text-brandText-dark focus:outline-none placeholder-brandText-light"
                />
                <button
                  suppressHydrationWarning
                  type="submit"
                  className="flex items-center justify-center bg-brandRed text-white px-4 hover:bg-brandRed-hover transition-colors"
                  aria-label="Subscribe to newsletter"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-brandBorder-light pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-[11px] font-bold text-brandText-light mb-4 md:mb-0 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All Rights Reserved.
          </p>

          {/* Social Icons */}
          <div className="flex space-x-5">
            {siteConfig.footer.socialLinks?.facebook && (
              <Link href={siteConfig.footer.socialLinks.facebook} className="text-brandText-light hover:text-brandRed transition-colors" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
            )}
            {siteConfig.footer.socialLinks?.twitter && (
              <Link href={siteConfig.footer.socialLinks.twitter} className="text-brandText-light hover:text-brandRed transition-colors" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
            )}
            {siteConfig.footer.socialLinks?.instagram && (
              <Link href={siteConfig.footer.socialLinks.instagram} className="text-brandText-light hover:text-brandRed transition-colors" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
