"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem(`${siteConfig.name.replace(/\s+/g, '_').toLowerCase()}_cookie_consent`);
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(`${siteConfig.name.replace(/\s+/g, '_').toLowerCase()}_cookie_consent`, "true");
    setShow(false);
  };

  const handleDecline = () => {
    // Some regions require explicit decline handling, 
    // but typically we can just hide it for the session or set a decline flag
    localStorage.setItem(`${siteConfig.name.replace(/\s+/g, '_').toLowerCase()}_cookie_consent`, "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-full duration-500">
      <div className="flex-1 max-w-4xl text-sm leading-relaxed text-slate-300">
        <p>
          We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
        </p>
      </div>
      <div className="flex items-center space-x-3 whitespace-nowrap">
        <button
          onClick={handleDecline}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="px-6 py-2 text-sm font-bold bg-[#ff385c] hover:bg-[#e31c5f] text-white rounded-md transition-colors"
        >
          Accept All
        </button>
        <button onClick={handleDecline} className="ml-2 text-slate-400 hover:text-white p-1" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
