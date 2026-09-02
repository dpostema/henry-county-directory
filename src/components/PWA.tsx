"use client";

import { useEffect } from "react";

export default function PWA() {
  useEffect(() => {
    // Only register SW in production to avoid HMR conflicts in development
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    }
  }, []);

  return null;
}
