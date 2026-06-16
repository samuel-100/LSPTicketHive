"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Event {
  id: string;
  title: string;
  shortDesc?: string;
  coverImageUrl?: string;
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
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    const res = await fetch(`${API_URL}/api/events?${params}`);
    const data = await res.json();
    setEvents(data.data?.items || []);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchEvents(search);
  }

  const getMinPrice = (event: Event) => {
    const prices = event.ticketTypes.map(t => t.price);
    const min = Math.min(...prices);
    return min === 0 ? "Free" : `From $${min.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-brand-600">LSPTicketHive</Link>
          <nav className="flex gap-4">
            <Link href="/login" className="text-gray-600 hover:text-brand-600">Login</Link>
            <Link href="/register" className="bg-brand-600 text-white px-4 py-2 rounded-lg">Sign Up</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <button type="submit" className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700">
              Search
            </button>
          </div>
        </form>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No events found. Check back soon!</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-brand-400 to-brand-600 rounded-t-xl flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">{event.category || "Event"}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                  <p className="text-gray-500 text-sm mb-3">{event.shortDesc}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <MapPin className="w-4 h-4" />
                      {event.venue}, {event.city}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-600">{getMinPrice(event)}</span>
                    <span className="text-xs text-gray-400">by {event.organization.name}</span>
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
