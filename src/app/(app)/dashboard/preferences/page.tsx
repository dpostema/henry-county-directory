"use client";

import { useState } from "react";
import { Bell, Mail, Smartphone } from "lucide-react";

// Web Push Public Key should come from env in real app
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PreferencesPage() {
  const [pushStatus, setPushStatus] = useState<string>("Requires Setup");
  const [preferences, setPreferences] = useState({
    email: true,
    push: false,
    deals: true,
    leads: true,
    reviews: true,
  });

  const handleSubscribe = async () => {
    if (!publicVapidKey) {
      alert("Missing VAPID Key. Check your environment variables.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported by your browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("Denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      // Send subscription to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setPushStatus("Subscribed");
        setPreferences((p) => ({ ...p, push: true }));
      } else {
        alert("Failed to save subscription.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while subscribing.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-brandText-dark mb-2">Notification Preferences</h1>
        <p className="text-brandText-medium text-lg">Manage how and when you receive updates.</p>
      </div>

      <div className="bg-brandBg-card rounded-2xl border border-brandBorder-light shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-brandBorder-light flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-semibold text-brandText-dark flex items-center gap-2">
              <Mail className="w-5 h-5 text-brandRed" />
              Email Notifications
            </h2>
            <p className="text-brandText-light text-sm mt-1">Receive updates straight to your inbox.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={preferences.email} onChange={(e) => setPreferences({...preferences, email: e.target.checked})} />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-brandRed after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brandBorder-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-semibold text-brandText-dark flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-brandRed" />
              Push Notifications
            </h2>
            <p className="text-brandText-light text-sm mt-1">Get instant alerts on your device. Status: <span className="font-medium text-brandText-dark">{pushStatus}</span></p>
          </div>
          {preferences.push ? (
             <div className="text-badge-verified font-medium flex items-center gap-1">
               <Bell className="w-4 h-4" /> Enabled
             </div>
          ) : (
            <button
              onClick={handleSubscribe}
              className="bg-brandRed text-white px-4 py-2 rounded-btn font-bold hover:bg-brandRed-hover transition-colors"
            >
              Enable Push
            </button>
          )}
        </div>
      </div>

      <div className="bg-brandBg-app rounded-2xl p-6 border border-brandBorder-light">
        <h3 className="text-lg font-heading font-bold mb-4 text-brandText-dark">What to notify me about</h3>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5 text-brandRed rounded border-brandBorder-light focus:ring-brandRed" checked={preferences.leads} onChange={(e) => setPreferences({...preferences, leads: e.target.checked})} />
            <span className="text-brandText-medium font-medium">New Leads / Messages</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5 text-brandRed rounded border-brandBorder-light focus:ring-brandRed" checked={preferences.reviews} onChange={(e) => setPreferences({...preferences, reviews: e.target.checked})} />
            <span className="text-brandText-medium font-medium">New Reviews</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5 text-brandRed rounded border-brandBorder-light focus:ring-brandRed" checked={preferences.deals} onChange={(e) => setPreferences({...preferences, deals: e.target.checked})} />
            <span className="text-brandText-medium font-medium">Platform Updates & Deals</span>
          </label>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button className="bg-brandText-dark hover:bg-black text-white px-6 py-3 rounded-btn font-bold shadow-sm transition-colors" onClick={() => alert("Preferences Saved!")}>
          Save Preferences
        </button>
      </div>
    </div>
  );
}
