"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, MapPin, Search } from "lucide-react";
import dynamic from "next/dynamic";

const EventMap = dynamic(() => import("../components/EventMap"), { ssr: false });

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
  ticketTypes: { price: number; sold: number; quantity: number }[];
  organization: { name: string };
}

function EventsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlCity = searchParams.get("city") || "";
    const urlSearch = searchParams.get("search") || "";
    setCity(urlCity);
    setSearch(urlSearch);
    fetchEvents(urlSearch, urlCity, "");
  }, [searchParams]);

  async function fetchEvents(query?: string, filterCity?: string, filterCat?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query || search) params.set("search", query || search);
      if (filterCity || city) params.set("city", filterCity || city);
      if (filterCat || category) params.set("category", filterCat || category);
      const res = await fetch(`${API_URL}/api/events?${params}`, { credentials: "include" });
      const data = await res.json();
      setEvents(data.data?.items || []);
    } catch {
      setEvents([]);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchEvents(search, city, category);
  }

  function selectCategory(cat: string) {
    setCategory(cat === category ? "" : cat);
    fetchEvents(search, city, cat === category ? "" : cat);
  }

  const getMinPrice = (event: Event) => {
    const prices = event.ticketTypes.map(t => t.price);
    const min = Math.min(...prices);
    return min === 0 ? "Free" : `€${min}`;
  };

  const getStatus = (event: Event) => {
    const totalQty = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);
    const totalSold = event.ticketTypes.reduce((s, t) => s + t.sold, 0);
    const pct = totalQty > 0 ? totalSold / totalQty : 0;
    if (pct > 0.9) return "Almost full";
    if (pct > 0.7) return "Going fast";
    return null;
  };

  const categories = ["Music", "Nightlife", "Food & Drink", "Tech", "Comedy", "Arts", "Sports", "Business"];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {city ? `Events in ${city}` : "All Events"}
          </h1>
          <p className="text-white/40 text-sm mt-1">Find something you love in your area</p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-20 space-y-6">
              {/* Category */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Category</h3>
                <ul className="space-y-2">
                  {categories.map(cat => (
                    <li key={cat}>
                      <button
                        onClick={() => selectCategory(cat)}
                        className={`text-sm transition-colors ${category === cat ? "text-brand-400 font-medium" : "text-white/40 hover:text-white/60"}`}
                      >
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Date */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Date</h3>
                <ul className="space-y-2 text-sm text-white/40">
                  <li><button className="hover:text-white/60">Today</button></li>
                  <li><button className="hover:text-white/60">Tomorrow</button></li>
                  <li><button className="hover:text-white/60">This weekend</button></li>
                  <li><button className="hover:text-white/60">This month</button></li>
                </ul>
              </div>

              {/* Price */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Price</h3>
                <ul className="space-y-2 text-sm text-white/40">
                  <li><button className="hover:text-white/60">Free</button></li>
                  <li><button className="hover:text-white/60">Paid</button></li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Event List */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-16 text-white/30">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-lg font-medium text-white/60 mb-2">No events found</h3>
                <p className="text-white/30 mb-6">Try a different search or location</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map(event => {
                  const status = getStatus(event);
                  return (
                    <Link key={event.id} href={`/events/${event.id}`} className="group flex gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-brand-500/20 transition-all">
                      {/* Image */}
                      <div className="w-40 h-24 rounded-lg overflow-hidden shrink-0">
                        {event.coverImageUrl ? (
                          <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-brand-700/10 flex items-center justify-center">
                            <span className="text-brand-400/40 text-xs">{event.category}</span>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {status && (
                          <span className="text-xs font-medium text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">{status}</span>
                        )}
                        <h3 className="font-semibold text-white mt-1 group-hover:text-brand-400 transition-colors truncate">{event.title}</h3>
                        <div className="text-sm text-white/40 mt-1">
                          {new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "long" })} at {new Date(event.startDate).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {event.venue && (
                          <div className="text-sm text-white/30 mt-0.5">{event.city} · {event.venue}</div>
                        )}
                        <div className="text-sm font-medium text-white/60 mt-1">From {getMinPrice(event)}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Map */}
          <aside className="lg:w-[45%] shrink-0">
            <div className="sticky top-16 h-64 lg:h-[calc(100vh-70px)] rounded-xl overflow-hidden border border-white/5 mb-6 lg:mb-0">
              <EventMap events={events.map(e => ({ id: e.id, title: e.title, venue: e.venue, city: e.city }))} city={city} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>}>
      <EventsContent />
    </Suspense>
  );
}
