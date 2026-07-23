import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, MapPin, Building2, ExternalLink } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local Events | Henry County Directory",
  description: "Check out local happenings, live music sessions, sales events, and social gatherings.",
};

export const revalidate = 60; // ISR cache revalidation

export default async function EventsCalendarPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(`
      *,
      business:businesses(name, slug)
    `)
    .order("event_date", { ascending: true });

  const displayEvents = !error && events ? events : [];

  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col justify-between">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="border-b border-brandBorder-light pb-6">
            <h1 className="text-3xl font-extrabold text-brandText-dark font-heading tracking-tight flex items-center space-x-2">
              <Calendar className="h-7 w-7 text-brandRed" />
              <span>Henry County Events Calendar</span>
            </h1>
            <p className="text-sm text-brandText-light mt-1 font-light">
              Check out local happenings, live music sessions, sales events, and social gatherings.
            </p>
          </div>

          <div className="space-y-6">
            {displayEvents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-card border border-brandBorder-light italic text-sm text-brandText-light">
                No local events scheduled. Check back later!
              </div>
            ) : (
              displayEvents.map((event) => {
                const dateObj = new Date(event.event_date);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                const formattedTime = dateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <article
                    key={event.id}
                    className="bg-brandBg-card p-6 rounded-card border border-brandBorder-light shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[10px] font-bold text-brandRed uppercase bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-btn flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formattedDate} &bull; {formattedTime}</span>
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-brandText-dark font-heading leading-tight">
                        {event.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-brandText-medium font-light leading-relaxed">
                        {event.description || "Join us for this local event!"}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2 text-xs md:text-right border-t md:border-t-0 md:border-l border-brandBorder-light pt-4 md:pt-0 md:pl-6 flex-shrink-0 min-w-[200px]">
                      {event.location && (
                        <div className="flex items-center md:justify-end space-x-1.5 text-brandText-light mb-1">
                          <MapPin className="h-4 w-4 text-brandText-light flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      <div className="flex items-center md:justify-end space-x-1.5 text-brandText-light">
                        <Building2 className="h-4 w-4 text-brandText-light flex-shrink-0" />
                        <Link
                          href={`/listings/${event.business?.slug}`}
                          className="font-bold text-brandText-dark hover:text-brandRed flex items-center space-x-1 truncate"
                        >
                          <span>{event.business?.name}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
