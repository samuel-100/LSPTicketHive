"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Event {
  id: string;
  title: string;
  shortDesc?: string;
  coverImageUrl?: string | null;
  venue?: string;
  city?: string;
  startDate: string;
  category?: string;
  ticketTypes: { price: number }[];
  organization: { name: string };
}

export default function EventsGrid() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/events?limit=6`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setEvents(data.data?.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl h-72 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  const getMinPrice = (event: Event) => {
    const prices = event.ticketTypes.map(t => t.price);
    const min = Math.min(...prices);
    return min === 0 ? "Free" : `€${min}`;
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {events.map(event => (
        <Link key={event.id} href={`/events/${event.id}`} className="group bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-brand-500/30 transition-all duration-200">
          <div className="h-40 relative overflow-hidden">
            {event.coverImageUrl ? (
              <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-brand-700/10 flex items-center justify-center">
                <span className="text-brand-400/50 text-xs uppercase tracking-wider">{event.category}</span>
              </div>
            )}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {getMinPrice(event)}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-white mb-1.5 group-hover:text-brand-400 transition-colors line-clamp-1">{event.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "short", month: "short", day: "numeric" })}
            </div>
            {event.venue && (
              <div className="flex items-center gap-1.5 text-xs text-white/30">
                <MapPin className="w-3.5 h-3.5" />
                {event.venue}, {event.city}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
