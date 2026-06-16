"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Search, Ticket } from "lucide-react";

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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents(query?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      const res = await fetch(`${API_URL}/api/events?${params}`);
      const data = await res.json();
      setEvents(data.data?.items || []);
    } catch {
      setEvents([]);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchEvents(search);
  }

  const getMinPrice = (event: Event) => {
    const prices = event.ticketTypes.map(t => t.price);
    const min = Math.min(...prices);
    return min === 0 ? "Free" : `From €${min.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white">LSPTicketHive</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="bg-brand-500 text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-400 transition-colors">Sign Up</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Title + Search */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Events</h1>
          <p className="text-white/40 mb-6">Discover amazing events happening near you</p>
          <form onSubmit={handleSearch}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/20" />
                <input
                  type="text"
                  placeholder="Search events, venues, cities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <button type="submit" className="bg-brand-500 text-black px-6 py-3.5 rounded-xl font-semibold hover:bg-brand-400 transition-colors">
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white/60 mb-2">No events yet</h3>
            <p className="text-white/30 mb-6">Be the first to create an event on LSPTicketHive</p>
            <Link href="/register?role=organizer" className="inline-flex bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 transition-colors">
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-500/30 transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-brand-500/20 to-brand-700/10 flex items-center justify-center relative overflow-hidden">
                  {event.coverImageUrl ? (
                    <img src={event.coverImageUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <span className="text-brand-400/60 text-sm font-medium uppercase tracking-wider">{event.category || "Event"}</span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-brand-400 transition-colors">{event.title}</h3>
                  <p className="text-white/30 text-sm mb-4 line-clamp-2">{event.shortDesc}</p>
                  <div className="flex items-center gap-2 text-sm text-white/40 mb-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
                      <MapPin className="w-4 h-4" />
                      {event.venue}, {event.city}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="font-semibold text-brand-400">{getMinPrice(event)}</span>
                    <span className="text-xs text-white/20">by {event.organization.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
