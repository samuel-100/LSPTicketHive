"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  ticketTypes: { price: number; quantity: number; sold: number }[];
  organization: { name: string };
}

export default function EventsGrid({ endpoint = "/api/events?limit=6&sort=popular" }: { endpoint?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}${endpoint}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setEvents(data.data?.items || data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [endpoint]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl h-72 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  const getMinPrice = (event: Event) => {
    const prices = event.ticketTypes.map(t => t.price);
    const min = prices.length ? Math.min(...prices) : 0;
    return min === 0 ? "Free" : `€${min}`;
  };

  const getStatus = (event: Event) => {
    const q = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);
    const sold = event.ticketTypes.reduce((s, t) => s + t.sold, 0);
    if (q > 0 && sold / q >= 1) return { label: "Sold Out", cls: "bg-red-500/80" };
    if (q > 0 && sold / q > 0.85) return { label: "Almost Gone", cls: "bg-orange-500/80" };
    if (q > 0 && sold / q > 0.6) return { label: "Selling Fast", cls: "bg-brand-500/80 text-black" };
    return null;
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {events.map((event, i) => {
        const status = getStatus(event);
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
          >
            <Link href={`/events/${event.id}`} className="group block bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-500/40 hover:shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)] transition-all duration-300">
              <div className="h-44 relative overflow-hidden">
                {event.coverImageUrl ? (
                  <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="on-image w-full h-full bg-gradient-to-br from-brand-600 to-emerald-800 flex items-center justify-center">
                    <span className="text-white/80 text-xs uppercase tracking-wider font-medium">{event.category || "Event"}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {getMinPrice(event)}
                </div>
                {status && (
                  <div className={`absolute top-3 right-3 ${status.cls} text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md`}>
                    {status.label}
                  </div>
                )}
                {event.category && (
                  <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-wider text-white/80 font-medium">
                    {event.category}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1.5 group-hover:text-brand-400 transition-colors line-clamp-1">{event.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-brand-400/80 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "short", month: "short", day: "numeric" })}
                </div>
                {event.venue && (
                  <div className="flex items-center gap-1.5 text-xs text-white/30">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{event.venue}{event.city ? `, ${event.city}` : ""}</span>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
