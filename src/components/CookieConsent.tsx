"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { siteConfig } from "@/config/site";
import Link from "next/link";

interface CookieConsentProps {
  cookieKey?: string;
  message?: string;
  acceptText?: string;
  declineText?: string;
  policyUrl?: string;
  policyText?: string;
}

export default function CookieConsent({
  cookieKey = siteConfig.cookieConsentKey,
  message = siteConfig.cookieConsentMessage,
  acceptText = siteConfig.cookieConsentAccept,
  declineText = siteConfig.cookieConsentDecline,
  policyUrl = "/privacy",
  policyText = "Privacy Policy",
}: CookieConsentProps) {
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem(cookieKey);
    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    }
  }, [cookieKey]);

  const handleAccept = () => {
    setIsExiting(true);
    setTimeout(() => {
      localStorage.setItem(cookieKey, "true");
      setShow(false);
    }, 500);
  };

  const handleDecline = () => {
    setIsExiting(true);
    // Some regions require explicit decline handling, 
    // but typically we can just hide it for the session or set a decline flag
    setTimeout(() => {
      localStorage.setItem(cookieKey, "declined");
      setShow(false);
    }, 500);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className={`fixed bottom-0 left-0 right-0 z-50 bg-brandText-dark text-white p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500 ease-in-out ${
        isExiting ? "translate-y-full opacity-0" : "animate-in slide-in-from-bottom-full"
      }`}
    >
      <div className="flex-1 max-w-4xl text-sm leading-relaxed text-slate-300">
        <p>
          {message}
          {policyUrl && (
            <>
              {" "}
              <Link href={policyUrl} className="underline hover:text-white transition-colors">
                {policyText}
              </Link>
              .
            </>
          )}
        </p>
      </div>
      <div className="flex items-center space-x-3 whitespace-nowrap">
        <button
          onClick={handleDecline}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          {declineText}
        </button>
        <button
          onClick={handleAccept}
          className="px-6 py-2 text-sm font-bold bg-brandRed hover:bg-brandRed-hover text-white rounded-md transition-colors"
        >
          {acceptText}
        </button>
        <button onClick={handleDecline} className="ml-2 text-slate-400 hover:text-white p-1" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
