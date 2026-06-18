"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { TOP_CATEGORIES } from "../lib/categories";

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
  const [dateFilter, setDateFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [sort, setSort] = useState(searchParams.get("sort") || "date");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlCity = searchParams.get("city") || "";
    const urlSearch = searchParams.get("search") || "";
    setCity(urlCity);
    setSearch(urlSearch);
    fetchEvents(urlSearch, urlCity, "");
  }, [searchParams]);

  // Refetch when the sort option changes.
  useEffect(() => {
    fetchEvents(search, city, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  async function fetchEvents(query?: string, filterCity?: string, filterCat?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query || search) params.set("search", query || search);
      if (filterCity || city) params.set("city", filterCity || city);
      if (filterCat || category) params.set("category", filterCat || category);
      if (sort && sort !== "date") params.set("sort", sort);
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

  // Client-side date + price filtering on top of the server's city/category/search.
  function inDateRange(iso: string): boolean {
    if (!dateFilter) return true;
    const d = new Date(iso);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 86400000;
    if (dateFilter === "today") {
      return d >= startOfDay && d < new Date(startOfDay.getTime() + dayMs);
    }
    if (dateFilter === "tomorrow") {
      const t = new Date(startOfDay.getTime() + dayMs);
      return d >= t && d < new Date(t.getTime() + dayMs);
    }
    if (dateFilter === "weekend") {
      // Upcoming Sat 00:00 → Mon 00:00
      const day = startOfDay.getDay(); // 0 Sun..6 Sat
      const daysUntilSat = (6 - day + 7) % 7;
      const sat = new Date(startOfDay.getTime() + daysUntilSat * dayMs);
      return d >= sat && d < new Date(sat.getTime() + 2 * dayMs);
    }
    if (dateFilter === "month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return true;
  }

  function matchesPrice(event: Event): boolean {
    if (!priceFilter) return true;
    const min = Math.min(...event.ticketTypes.map(t => t.price));
    return priceFilter === "free" ? min === 0 : min > 0;
  }

  const visibleEvents = events.filter(e => inDateRange(e.startDate) && matchesPrice(e));

  const categories = TOP_CATEGORIES;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {city ? `Events in ${city}` : "All Events"}
            </h1>
            <p className="text-white/40 text-sm mt-1">Find something you love in your area</p>
          </div>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); }}
            className="bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="date">Soonest</option>
            <option value="popular">Trending</option>
            <option value="new">Newest</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
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
                <ul className="space-y-2 text-sm">
                  {[["today", "Today"], ["tomorrow", "Tomorrow"], ["weekend", "This weekend"], ["month", "This month"]].map(([val, label]) => (
                    <li key={val}>
                      <button
                        onClick={() => setDateFilter(dateFilter === val ? "" : val)}
                        className={`transition-colors ${dateFilter === val ? "text-brand-400 font-medium" : "text-white/40 hover:text-white/60"}`}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Price</h3>
                <ul className="space-y-2 text-sm">
                  {[["free", "Free"], ["paid", "Paid"]].map(([val, label]) => (
                    <li key={val}>
                      <button
                        onClick={() => setPriceFilter(priceFilter === val ? "" : val)}
                        className={`transition-colors ${priceFilter === val ? "text-brand-400 font-medium" : "text-white/40 hover:text-white/60"}`}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Event List */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-16 text-white/30">Loading events...</div>
            ) : visibleEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-lg font-medium text-white/60 mb-2">No events found</h3>
                <p className="text-white/30 mb-6">Try a different search, date, or location</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleEvents.map((event, i) => {
                  const status = getStatus(event);
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                    >
                      <Link href={`/events/${event.id}`} className="group flex gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-brand-500/40 hover:bg-white/[0.04] hover:shadow-[0_0_25px_-12px_rgba(34,197,94,0.35)] transition-all">
                        {/* Image */}
                        <div className="w-40 h-28 rounded-xl overflow-hidden shrink-0 relative">
                          {event.coverImageUrl ? (
                            <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="on-image w-full h-full bg-gradient-to-br from-brand-600 to-emerald-800 flex items-center justify-center">
                              <span className="text-white/80 text-xs uppercase tracking-wider font-medium">{event.category}</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            {getMinPrice(event)}
                          </div>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            {event.category && <span className="text-[10px] uppercase tracking-wider text-brand-400/70 font-medium">{event.category}</span>}
                            {status && (
                              <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">{status}</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-white text-lg group-hover:text-brand-400 transition-colors truncate">{event.title}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-white/40 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                            {new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })} · {new Date(event.startDate).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-1.5 text-sm text-white/30 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{event.venue}{event.city ? `, ${event.city}` : ""}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Map */}
          <aside className="lg:w-[45%] shrink-0">
            <div className="sticky top-16 h-64 lg:h-[calc(100vh-70px)] rounded-xl overflow-hidden border border-white/5 mb-6 lg:mb-0">
              <EventMap events={visibleEvents.map(e => ({ id: e.id, title: e.title, venue: e.venue, city: e.city }))} city={city} />
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
