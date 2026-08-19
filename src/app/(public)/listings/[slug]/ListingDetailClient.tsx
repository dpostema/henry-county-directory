"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Phone, Mail, Globe, CircleCheck, Clock, MessageSquare, Send, Heart, Scale, Copy, Check, Calendar } from "lucide-react";
import { submitLead, submitReview, submitQuestion } from "./actions";
import { isBusinessOpenNow } from "@/services/search";
import { toggleFavoriteAction, checkFavoriteStatus, createBookingAction } from "@/app/(public)/listings/actions";
import { hasFeatureAccess } from "@/utils/featureGate";
import { getEntitlements } from "@/utils/entitlements";
import Map from "@/components/Map";
import { siteConfig } from "@/config/site";

interface ListingDetailClientProps {
  business: any;
  user: any;
  dbReviews: any[];
  dbQnas: any[];
}

export default function ListingDetailClient({ business, user, dbReviews, dbQnas }: ListingDetailClientProps) {
  // Image slider active index
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Save to recent history
  useEffect(() => {
    if (!business) return;
    try {
      const stored = localStorage.getItem("recent_history");
      let history = stored ? JSON.parse(stored) : [];
      // Remove if already exists to push it to the front
      history = history.filter((item: any) => item.slug !== business.slug);
      history.unshift({
        name: business.name,
        slug: business.slug,
        cover_image_url: business.cover_image_url || business.media?.[0]?.url || null,
      });
      // Keep only last 10
      if (history.length > 10) history = history.slice(0, 10);
      localStorage.setItem("recent_history", JSON.stringify(history));
    } catch (e) {
      console.error("Could not save to history", e);
    }
  }, [business]);

  // Visitor Engagement checks
  const [isFavorite, setIsFavorite] = useState(false);
  const [inCompareTray, setInCompareTray] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUrl(window.location.href);
  }, []);

  // Booking Appointment hooks
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDetails, setBookingDetails] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to book an appointment.");
      return;
    }
    setBookingLoading(true);
    setBookingSuccess(null);
    setBookingError(null);

    const fullDateTime = `${bookingDate}T${bookingTime}:00`;
    const res = await createBookingAction(business.id, fullDateTime, bookingDetails);
    setBookingLoading(false);

    if (res.success) {
      setBookingSuccess(res.success);
      setBookingDate("");
      setBookingTime("");
      setBookingDetails("");
    } else if (res.error) {
      setBookingError(res.error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await checkFavoriteStatus(business.id);
      setIsFavorite(res.isFavorite);

      // Check compare tray
      const saved = localStorage.getItem("compare_listings");
      if (saved) {
        try {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids) && ids.includes(business.id)) {
            setInCompareTray(true);
          }
        } catch (err) {
          console.log(err);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [business.id]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      alert("You must be logged in to save favorites.");
      return;
    }
    const res = await toggleFavoriteAction(business.id);
    if (res.success) {
      setIsFavorite(!!res.isFavorite);
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleCompareToggle = () => {
    const saved = localStorage.getItem("compare_listings");
    let ids: string[] = [];
    if (saved) {
      try {
        ids = JSON.parse(saved);
      } catch (err) {
        console.log(err);
      }
    }
    if (!Array.isArray(ids)) ids = [];

    if (ids.includes(business.id)) {
      ids = ids.filter((item) => item !== business.id);
      setInCompareTray(false);
    } else {
      if (ids.length >= 3) {
        alert("You can compare up to 3 listings at a time.");
        return;
      }
      ids.push(business.id);
      setInCompareTray(true);
    }
    localStorage.setItem("compare_listings", JSON.stringify(ids));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Form states
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSuccess, setLeadSuccess] = useState<string | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [qnaError, setQnaError] = useState<string | null>(null);
  const [qnaSuccess, setQnaSuccess] = useState<string | null>(null);
  const [qnaLoading, setQnaLoading] = useState(false);

  const isOpen = isBusinessOpenNow(business.hours_json);
  const mediaList = business.media && business.media.length > 0 
    ? business.media 
    : [{ url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop&q=60" }];

  // 1. Submit lead form
  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLeadError(null);
    setLeadSuccess(null);
    setLeadLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("businessId", business.id);
    const res = await submitLead(formData);

    setLeadLoading(false);
    if (res?.error) {
      setLeadError(res.error);
    } else if (res?.success) {
      setLeadSuccess(res.success);
      (e.target as HTMLFormElement).reset();
    }
  };

  // 2. Submit review form
  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);
    setReviewLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("businessId", business.id);
    formData.append("rating", reviewRating.toString());
    formData.append("slug", business.slug);
    const res = await submitReview(formData);

    setReviewLoading(false);
    if (res?.error) {
      setReviewError(res.error);
    } else if (res?.success) {
      setReviewSuccess(res.success);
      (e.target as HTMLFormElement).reset();
      setReviewRating(5);
    }
  };

  // 3. Submit question form
  const handleQuestionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQnaError(null);
    setQnaSuccess(null);
    setQnaLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("businessId", business.id);
    formData.append("slug", business.slug);
    const res = await submitQuestion(formData);

    setQnaLoading(false);
    if (res?.error) {
      setQnaError(res.error);
    } else if (res?.success) {
      setQnaSuccess(res.success);
      (e.target as HTMLFormElement).reset();
    }
  };

  const scheduleDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 lg:pb-8 sm:px-6 lg:px-8 w-full">
      {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[11px] font-bold text-brandText-light mb-6 uppercase tracking-wider whitespace-nowrap overflow-x-auto pb-1 hide-scrollbar">
          <Link href="/" className="hover:text-brandRed transition-colors flex-shrink-0">Home</Link>
          <span className="text-brandBorder-light flex-shrink-0">/</span>
          <Link href={`/category/${business.category?.slug || "all"}`} className="hover:text-brandRed transition-colors flex-shrink-0">{business.category?.name || "Local Listing"}</Link>
          <span className="text-brandBorder-light flex-shrink-0">/</span>
          <span className="text-brandRed flex-shrink-0 truncate">{business.name}</span>
        </nav>

        {/* 1. Image Gallery */}
        <div className="mb-10 rounded-xl overflow-hidden shadow-sm border border-brandBorder-light bg-white">
          <div className="relative min-h-[320px] sm:min-h-[350px] md:h-auto md:aspect-[21/9] w-full bg-slate-100 flex flex-col justify-end">
            <Image
              src={mediaList[activeImageIndex]?.url}
              alt={business.name}
              fill
              priority
              className="object-cover absolute inset-0 z-0"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none"></div>
            
            <div className="relative z-20 w-full p-4 sm:p-6 md:p-8 text-white flex flex-col md:flex-row justify-end md:justify-between items-start md:items-end gap-5">
              <div className="w-full md:w-auto">
                <div className="flex items-start gap-2 sm:gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight break-words">
                    {business.name}
                    {business.verification_level === "verified" && (
                      <CircleCheck className="inline-block ml-2 sm:ml-3 h-6 w-6 sm:h-7 sm:w-7 text-badge-verified fill-current bg-white rounded-full flex-shrink-0 align-middle -mt-1" />
                    )}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-slate-200 font-light mt-3 sm:mt-2">
                  <span className="bg-brandRed text-white font-bold px-2.5 py-1 rounded-md text-xs uppercase tracking-wider shadow-sm">
                    {business.category?.name || "Local Listing"}
                  </span>
                  <span className="hidden sm:inline opacity-60">&bull;</span>
                  <span className="flex items-center whitespace-nowrap bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-md"><MapPin className="h-3.5 w-3.5 mr-1.5" /> {business.city?.name || siteConfig.region.name}, GA</span>
                </div>
              </div>

              {/* Overall Rating display */}
              <div className="flex items-center space-x-3 mt-2 md:mt-0 self-start md:self-end flex-shrink-0">
                <div className="text-badge-rating flex items-center drop-shadow-md">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 fill-current" />
                </div>
                <div className="text-left drop-shadow-md">
                  <span className="block text-2xl sm:text-3xl font-black leading-none text-white tracking-tight">{business.rating_avg.toFixed(1)}</span>
                  <span className="text-[10px] sm:text-xs text-slate-200 font-bold uppercase tracking-wider opacity-90">{business.review_count} Reviews</span>
                </div>
              </div>
            </div>
        </div>

        {/* Thumbnail Selector (if multiple images exist) */}
        {mediaList.length > 1 && (
          <div className="flex p-3 space-x-3 border-t border-brandBorder-light bg-slate-50 overflow-x-auto">
            {mediaList.map((media: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative h-16 w-24 rounded-btn overflow-hidden border-2 flex-shrink-0 transition ${
                  activeImageIndex === idx ? "border-brandRed" : "border-transparent"
                }`}
              >
                <Image src={media.url} alt="thumbnail" fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Page Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description, reviews, Q&A */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm">
            <h2 className="text-xl font-bold text-brandText-dark font-heading mb-4">
              About {business.name}
            </h2>
            <p className="text-brandText-medium font-light leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {business.description || "This local business has not provided a detailed description yet."}
            </p>
          </section>

          {/* Location Map Mock Section */}
          <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm">
            <h2 className="text-xl font-bold text-brandText-dark font-heading mb-4">
              Location & Map
            </h2>
            <div className="aspect-[16/6] bg-slate-100 rounded-btn border border-brandBorder-light relative overflow-hidden flex items-center justify-center mb-3">
              <div className="absolute inset-0 z-0">
                <Map 
                  latitude={Number(business.latitude)} 
                  longitude={Number(business.longitude)} 
                  popupText={business.name}
                />
              </div>
            </div>
            <p className="text-xs text-brandText-light flex items-center space-x-1 justify-center mt-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Coordinates: {Number(business.latitude || 0).toFixed(4)}, {Number(business.longitude || 0).toFixed(4)}</span>
            </p>
          </section>

          {/* Reviews List & Submission */}
          <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm">
            <h2 className="text-xl font-bold text-brandText-dark font-heading mb-6 flex justify-between items-center">
              <span>Reviews ({dbReviews.length})</span>
              <div className="flex items-center text-badge-rating text-sm space-x-1">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-bold text-brandText-dark">{business.rating_avg.toFixed(1)} / 5</span>
              </div>
            </h2>

            {/* Review form */}
            {user ? (
              <form onSubmit={handleReviewSubmit} className="mb-8 p-4 rounded-xl bg-slate-50 border border-brandBorder-light space-y-4">
                <h3 className="text-sm font-bold text-brandText-dark font-heading">Write a Review</h3>
                
                {/* Rating selection (Interactive Stars) */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-medium text-brandText-medium mr-2">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="text-badge-rating hover:scale-110 transition duration-150 focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (reviewHover || reviewRating) ? "fill-current" : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Comment area */}
                <div>
                  <label className="block text-xs font-medium text-brandText-medium mb-1">
                    Your Feedback
                  </label>
                  <textarea
                    name="comment"
                    rows={3}
                    placeholder="Tell other locals about your experience with this business..."
                    className="w-full p-2 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed bg-white"
                  />
                </div>

                {reviewError && (
                  <div className="p-3 text-xs text-brandRed bg-brandRed-muted rounded-btn border border-brandRed/20">
                    {reviewError}
                  </div>
                )}

                {reviewSuccess && (
                  <div className="p-3 text-xs text-badge-verified bg-emerald-50 rounded-btn border border-badge-verified/20">
                    {reviewSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold px-4 py-2 rounded-btn transition disabled:opacity-50"
                >
                  {reviewLoading ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-dashed border-brandBorder-light text-center">
                <p className="text-sm text-brandText-light">
                  You must be{" "}
                  <Link href="/auth/login" className="text-brandRed hover:underline font-semibold">
                    logged in
                  </Link>{" "}
                  to write a review.
                </p>
              </div>
            )}

            {/* List of reviews */}
            <div className="space-y-6">
              {dbReviews.length === 0 ? (
                <p className="text-sm text-brandText-light italic text-center py-6">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                dbReviews.map((rev) => (
                  <div key={rev.id} className="border-b border-brandBorder-light pb-6 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 border border-brandBorder-light flex items-center justify-center text-xs font-bold text-brandText-medium">
                          {rev.author?.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-brandText-dark font-heading">
                            {rev.author?.full_name || "Anonymous Local"}
                          </h4>
                          <span className="text-[10px] text-brandText-light block">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center text-badge-rating space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < rev.rating ? "fill-current" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-brandText-medium font-light leading-relaxed pl-12">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Q&A Section */}
          <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm">
            <h2 className="text-xl font-bold text-brandText-dark font-heading mb-6">
              <span>Questions & Answers ({dbQnas.length})</span>
            </h2>

            {/* Submit Question */}
            {user ? (
              <form onSubmit={handleQuestionSubmit} className="mb-8 p-4 rounded-xl bg-slate-50 border border-brandBorder-light space-y-3">
                <div>
                  <label className="block text-xs font-medium text-brandText-medium mb-1">
                    Ask a Question
                  </label>
                  <input
                    type="text"
                    name="question"
                    required
                    placeholder="Ask about pricing, parking, child policy, etc..."
                    className="w-full p-2 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed bg-white"
                  />
                </div>

                {qnaError && (
                  <div className="p-3 text-xs text-brandRed bg-brandRed-muted rounded-btn border border-brandRed/20">
                    {qnaError}
                  </div>
                )}

                {qnaSuccess && (
                  <div className="p-3 text-xs text-badge-verified bg-emerald-50 rounded-btn border border-badge-verified/20">
                    {qnaSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={qnaLoading}
                  className="bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold px-4 py-2 rounded-btn transition disabled:opacity-50"
                >
                  {qnaLoading ? "Posting..." : "Ask Question"}
                </button>
              </form>
            ) : (
              <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-dashed border-brandBorder-light text-center">
                <p className="text-sm text-brandText-light">
                  You must be{" "}
                  <Link href="/auth/login" className="text-brandRed hover:underline font-semibold">
                    logged in
                  </Link>{" "}
                  to ask a question.
                </p>
              </div>
            )}

            {/* Q&A Thread List */}
            <div className="space-y-6">
              {dbQnas.length === 0 ? (
                <p className="text-sm text-brandText-light italic text-center py-6">
                  No questions asked yet. Have any doubts? Ask the owner!
                </p>
              ) : (
                dbQnas.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl border border-brandBorder-light space-y-3 bg-slate-50/50">
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brandRed mb-1">
                        Question
                      </span>
                      <p className="text-sm font-bold text-brandText-dark leading-relaxed">
                        {q.question}
                      </p>
                      <span className="text-[9px] text-brandText-light">
                        Asked by {q.visitor?.full_name || "Visitor"} on {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {q.answer ? (
                      <div className="border-t border-brandBorder-light pt-3 pl-4">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-badge-verified mb-1">
                          Answer from Owner
                        </span>
                        <p className="text-sm text-brandText-medium font-light leading-relaxed">
                          {q.answer}
                        </p>
                        <span className="text-[9px] text-brandText-light block mt-1">
                          Answered on {q.answered_at ? new Date(q.answered_at).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    ) : (
                      <div className="border-t border-brandBorder-light pt-3 text-xs text-brandText-light italic pl-4">
                        Waiting for answer from the owner...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Address details, Schedule hours, Lead captures */}
        <div className="space-y-8">
          {/* Visitor Engagement Panel: Favorite, Compare, Social Share */}
          <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brandText-dark font-heading border-b border-brandBorder-light pb-2">
              Listing Actions
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <button
                type="button"
                onClick={handleFavoriteToggle}
                className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-btn border transition ${
                  isFavorite
                    ? "border-brandRed bg-red-50/10 text-brandRed font-bold"
                    : "border-brandBorder-light bg-white text-brandText-medium hover:bg-slate-50"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                <span>{isFavorite ? "Saved" : "Save Listing"}</span>
              </button>

              <button
                type="button"
                onClick={handleCompareToggle}
                className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-btn border transition ${
                  inCompareTray
                    ? "border-slate-800 bg-slate-50 text-slate-800 font-bold"
                    : "border-brandBorder-light bg-white text-brandText-medium hover:bg-slate-50"
                }`}
              >
                <Scale className="h-4 w-4" />
                <span>{inCompareTray ? "Comparing" : "Compare"}</span>
              </button>
            </div>

            {/* Social Share list */}
            <div className="space-y-2 pt-2 border-t border-brandBorder-light">
              <span className="text-[10px] font-bold text-brandText-light uppercase tracking-wider block">
                Share this Listing
              </span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-btn bg-slate-100 text-brandText-medium hover:bg-brandRed hover:text-white transition-colors"
                    title="Share on Facebook"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-btn bg-slate-100 text-brandText-medium hover:bg-brandRed hover:text-white transition-colors"
                    title="Share on X"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-btn bg-slate-100 text-brandText-medium hover:bg-brandRed hover:text-white transition-colors"
                    title="Share on LinkedIn"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-xs font-semibold text-brandText-medium hover:text-brandRed flex items-center space-x-1 p-2 rounded-btn border border-brandBorder-light bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {shareCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-badge-verified" />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Claim Listing Organic CTA */}
          {business.status === "unclaimed" && (
            <section className="bg-gradient-to-br from-red-50 to-white p-6 rounded-card border border-brandBorder-light shadow-sm text-center space-y-4">
              <span className="text-xs font-bold text-brandRed uppercase tracking-wider bg-red-100/50 border border-red-200 px-3 py-1 rounded-btn inline-block">
                Own this business?
              </span>
              <h3 className="text-base font-extrabold text-brandText-dark font-heading">
                Claim this Listing
              </h3>
              <p className="text-xs text-brandText-medium font-light leading-relaxed">
                Verify ownership to reply to local reviews, answer visitor Q&As, and manage your weekly operating schedule.
              </p>
              <Link
                href={`/claim/${business.slug}`}
                className="block w-full bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold py-2.5 rounded-btn shadow-sm transition-colors text-center"
              >
                Claim Now
              </Link>
            </section>
          )}

          {/* Status & Contact details */}
          <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brandBorder-light pb-4">
              <span className="text-sm font-semibold text-brandText-dark">
                <span>Hours Status</span>
              </span>
              <span className={`text-sm font-bold tracking-wide ${isOpen ? "text-badge-verified" : "text-brandRed"}`}>
                {isOpen ? "Open Now!" : "Closed Now!"}
              </span>
            </div>

            {/* Contact Mappings */}
            <div className="space-y-3 pt-2 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-brandText-light flex-shrink-0 mt-0.5" />
                <span className="text-brandText-medium font-light">{business.address}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-brandText-light flex-shrink-0" />
                <a href={`tel:${business.phone}`} className="text-brandText-medium font-light hover:text-brandRed hover:underline">
                  {business.phone || "No phone listed"}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-brandText-light flex-shrink-0" />
                <a href={`mailto:${business.email}`} className="text-brandText-medium font-light hover:text-brandRed hover:underline break-all">
                  {business.email || "No email listed"}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-brandText-light flex-shrink-0" />
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-brandText-medium font-light hover:text-brandRed hover:underline truncate">
                  {business.website || "No website listed"}
                </a>
              </div>
            </div>
          </section>

          {/* Operational Hours Weekly Schedule */}
          <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm">
            <h2 className="text-lg font-bold text-brandText-dark font-heading mb-4">
              Weekly Schedule
            </h2>
            <div className="space-y-2.5 text-sm">
              {scheduleDays.map((day) => {
                const hours = business.hours_json?.[day];
                const isClosed = !hours || hours.closed;
                return (
                  <div key={day} className="flex justify-between items-center text-xs sm:text-sm border-b border-brandBorder-light pb-2 last:border-b-0 last:pb-0">
                    <span className="font-medium text-brandText-medium">{day}</span>
                    {isClosed ? (
                      <span className="font-bold text-brandRed">Closed</span>
                    ) : (
                      <span className="text-brandText-dark">
                        {hours.open} &ndash; {hours.close}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Booking Appointment Widget */}
          <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-brandText-dark font-heading">
              <span>Book Appointment</span>
            </h2>

            {!getEntitlements(business.plan_tier).has_booking_calendar ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-brandBorder-light text-center space-y-2">
                <span className="text-[10px] font-bold text-brandRed uppercase tracking-wider block">
                  Premium Feature
                </span>
                <p className="text-xs text-brandText-light font-light leading-relaxed">
                  Online booking is currently unavailable. The business owner must upgrade to a Pro or Enterprise plan to enable direct calendar scheduling.
                </p>
              </div>
            ) : !user ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-brandBorder-light text-center">
                <p className="text-xs text-brandText-light font-light">
                  Please{" "}
                  <Link href="/auth/login" className="text-brandRed hover:underline font-bold">
                    log in
                  </Link>{" "}
                  to select a date and book an appointment with this business.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-dark mb-1">
                      Choose Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full p-2 text-xs border border-brandBorder-light rounded-btn bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brandText-dark mb-1">
                      Select Time
                    </label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full p-2 text-xs border border-brandBorder-light rounded-btn bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-dark mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="E.g., consultation request, dental cleaning, table request..."
                    value={bookingDetails}
                    onChange={(e) => setBookingDetails(e.target.value)}
                    className="w-full p-2 text-xs border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed bg-white"
                  />
                </div>

                {bookingError && (
                  <div className="p-2.5 text-xs text-brandRed bg-brandRed-muted rounded-btn border border-brandRed/20">
                    {bookingError}
                  </div>
                )}

                {bookingSuccess && (
                  <div className="p-2.5 text-xs text-badge-verified bg-emerald-50 rounded-btn border border-badge-verified/20">
                    {bookingSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold py-2.5 rounded-btn shadow-sm transition disabled:opacity-50"
                >
                  {bookingLoading ? "Booking Slot..." : "Request Appointment"}
                </button>
              </form>
            )}
          </section>

          {/* Lead Capture Form */}
          <section className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm">
            <h2 className="text-lg font-bold text-brandText-dark font-heading mb-4">
              Contact Business
            </h2>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brandText-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="John Doe"
                  className="w-full p-2 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brandText-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@example.com"
                  className="w-full p-2 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brandText-medium mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="770-555-0100"
                  className="w-full p-2 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brandText-medium mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="I'm interested in booking a service or visiting your location..."
                  className="w-full p-2 text-sm border border-brandBorder-light rounded-btn focus:outline-none focus:ring-1 focus:ring-brandRed"
                />
              </div>

              {leadError && (
                <div className="p-3 text-xs text-brandRed bg-brandRed-muted rounded-btn border border-brandRed/20">
                  {leadError}
                </div>
              )}

              {leadSuccess && (
                <div className="p-3 text-xs text-badge-verified bg-emerald-50 rounded-btn border border-badge-verified/20">
                  {leadSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={leadLoading}
                className="w-full bg-brandRed hover:bg-brandRed-hover text-white text-sm font-bold p-2.5 rounded-btn transition duration-250 disabled:opacity-50 text-center"
              >
                <span>{leadLoading ? "Sending..." : "Send Message"}</span>
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-brandBorder-light shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden z-50 flex items-center gap-3">
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className="flex-1 bg-brandBg-app border border-brandBorder-light text-brandText-dark hover:bg-slate-50 text-sm font-bold py-3 rounded-btn shadow-sm text-center flex items-center justify-center gap-2"
          >
            <Phone className="h-4 w-4" />
            <span>Call</span>
          </a>
        )}
        <button
          onClick={() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          }}
          className="flex-[2] bg-brandRed hover:bg-brandRed-hover text-white text-sm font-bold py-3 rounded-btn shadow-sm text-center flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" />
          <span>Message</span>
        </button>
      </div>
    </div>
  );
}
