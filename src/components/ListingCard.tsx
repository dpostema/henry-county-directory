"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import Image from "next/image";
import { Star, Heart, MapPin, CheckCircle, Eye } from "lucide-react";
import { isBusinessOpenNow } from "@/services/search";

interface ListingCardProps {
  business: {
    id: string;
    name: string;
    slug: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    hours_json: any;
    verification_level: string;
    status: string;
    plan_tier: string;
    is_featured: boolean;
    rating_avg: number;
    review_count: number;
    category?: {
      name: string;
      slug: string;
      icon: string;
    };
    city?: {
      name: string;
      slug: string;
      state: string;
    };
    media?: Array<{
      url: string;
    }>;
  };
}

export default function ListingCard({ business }: ListingCardProps) {
  const isOpen = isBusinessOpenNow(business.hours_json);
  const mainImage = business.media && business.media.length > 0
    ? business.media[0].url
    : "";

  // Determine custom badge
  let badgeText = "";
  let badgeColorClass = "";

  if (business.is_featured) {
    badgeText = "Featured";
    badgeColorClass = "bg-badge-featured text-white";
  } else if (business.plan_tier === "enterprise") {
    badgeText = "Ad";
    badgeColorClass = "bg-badge-ad text-white";
  } else if (business.rating_avg >= 4.5 && business.review_count > 5) {
    badgeText = "Best Rate";
    badgeColorClass = "bg-badge-bestrate text-white";
  } else if (business.review_count > 10) {
    badgeText = "Most View";
    badgeColorClass = "bg-badge-mostview text-white";
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23E9ECEF'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%236C757D'>${encodeURIComponent(business.name)}</text></svg>`;

  return (
    <article className="group relative bg-white rounded-xl border border-brandBorder-light overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={business.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={fallbackSvg}
            alt={business.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Badge */}
        {badgeText && (
          <span className={`absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md ${badgeColorClass}`}>
            {badgeText}
          </span>
        )}

        {/* Heart */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-brandRed transition-colors"
          aria-label={`Save ${business.name}`}
        >
          <Heart className="h-3.5 w-3.5" />
        </button>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Link
            href={`/listings/${business.slug}`}
            className="flex items-center space-x-1.5 bg-white text-brandText-dark text-xs font-bold px-4 py-2 rounded-lg shadow-md hover:bg-brandRed hover:text-white transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Quickview</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col relative pt-7">
        {/* Avatar overlap */}
        <div className="absolute -top-5 left-4 h-10 w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${business.name}`}
            alt="Owner"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Title + verify */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-bold text-brandText-dark line-clamp-1 hover:text-brandRed transition-colors font-heading">
            <Link href={`/listings/${business.slug}`}>{business.name}</Link>
          </h3>
          {business.verification_level === "verified" && (
            <CheckCircle className="h-3.5 w-3.5 text-badge-verified flex-shrink-0 ml-1 mt-0.5" />
          )}
        </div>

        {/* Rating + Price + Category */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-brandText-light mb-2">
          <div className="flex items-center text-badge-rating space-x-0.5">
            <Star className="h-3 w-3 fill-current" />
            <span className="font-bold text-brandText-dark">{(business.rating_avg || 0).toFixed(1)}</span>
            <span>Rating</span>
          </div>
          <span className="text-brandBorder-light">|</span>
          <span className="font-medium">From <span className="text-brandText-dark font-bold">${((business.rating_avg || 3) * 10 + 10).toFixed(2)}</span></span>
          <span className="text-brandBorder-light">|</span>
          <span className="bg-brandRed-muted text-brandRed font-bold px-1.5 py-0.5 rounded text-[10px]">
            {business.category?.name || "Directory"}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-brandText-medium leading-relaxed line-clamp-2 mb-3 flex-grow">
          {business.description || "No description provided for this local business."}
        </p>

        {/* Divider */}
        <div className="border-t border-brandBorder-light my-2"></div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center text-brandText-light space-x-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate max-w-[100px]">{business.city?.name || "Henry County"}, GA</span>
          </div>
          <span className={`font-bold ${isOpen ? "text-badge-verified" : "text-brandRed"}`}>
            {isOpen ? "Open Now!" : "Closed Now!"}
          </span>
        </div>
      </div>
    </article>
  );
}
