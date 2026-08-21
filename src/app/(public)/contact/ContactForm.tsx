"use client";

import { useState } from "react";
import { submitContactForm } from "./actions";

export default function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await submitContactForm(formData);

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(res.success);
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <div className="bg-white p-8 rounded-card border border-brandBorder-light shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-brandText-medium mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="John Doe"
              className="w-full p-3 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-2 focus:ring-brandRed/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brandText-medium mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="john@example.com"
              className="w-full p-3 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-2 focus:ring-brandRed/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-brandText-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="770-555-0100"
              className="w-full p-3 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-2 focus:ring-brandRed/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brandText-medium mb-1">
              Subject
            </label>
            <input
              type="text"
              name="subject"
              placeholder="How can we help?"
              className="w-full p-3 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-2 focus:ring-brandRed/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brandText-medium mb-1">
            Message *
          </label>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="Write your message here..."
            className="w-full p-3 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-2 focus:ring-brandRed/50"
          />
        </div>

        {error && (
          <div className="p-4 text-sm text-brandRed bg-brandRed-muted rounded-btn border border-brandRed/20">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 text-sm text-badge-verified bg-emerald-50 rounded-btn border border-badge-verified/20">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brandRed hover:bg-brandRed-hover text-white text-base font-bold py-3.5 rounded-btn shadow-sm transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
