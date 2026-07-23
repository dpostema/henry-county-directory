import { createClient } from "@/utils/supabase/server";
import { Star, CircleCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface WidgetPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ListingWidgetPage({ params }: WidgetPageProps) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, rating_avg, review_count, verification_level")
    .eq("slug", slug)
    .single();

  if (!business) {
    return notFound();
  }

  const rating = Number(business.rating_avg) || 0.0;
  const starsArray = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="w-full h-screen bg-white flex items-center justify-center p-3 font-sans border border-slate-200 rounded-lg shadow-sm max-w-[320px] max-h-[140px] mx-auto select-none overflow-hidden">
      <div className="flex items-center space-x-3.5 w-full">
        {/* Rating score circle */}
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-red-50 border border-red-100 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-800 leading-none">
            {rating.toFixed(1)}
          </span>
          <span className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">
            Stars
          </span>
        </div>

        {/* Info panel */}
        <div className="flex-grow min-w-0 space-y-1">
          <div className="flex items-center space-x-1">
            <h4 className="text-xs font-bold text-slate-800 truncate">
              {business.name}
            </h4>
            {business.verification_level === "verified" && (
              <CircleCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            )}
          </div>

          {/* Stars grid */}
          <div className="flex items-center space-x-0.5">
            {starsArray.map((starNum) => (
              <Star
                key={starNum}
                className={`h-3 w-3 ${
                  starNum <= Math.round(rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-200 fill-slate-200"
                }`}
              />
            ))}
            <span className="text-[10px] font-semibold text-slate-500 ml-1.5">
              ({business.review_count})
            </span>
          </div>

          <p className="text-[9px] text-slate-400 font-light leading-none">
            Henry County Directory
          </p>

          <Link
            href={`/listings/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors pt-1"
          >
            <span>Read reviews</span>
            <ExternalLink className="h-2.5 w-2.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
