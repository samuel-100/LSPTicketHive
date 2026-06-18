"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Calendar, MapPin } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface SavedEvent {
  id: string;
  title: string;
  startDate: string;
  venue?: string;
  city?: string;
  coverImageUrl?: string;
  ticketTypes: { price: number }[];
  organization?: { name: string };
}

export default function SavedPage() {
  const router = useRouter();
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API_URL}/api/engagement/saved`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setEvents(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const minPrice = (e: SavedEvent) => {
    if (!e.ticketTypes?.length) return "";
    const m = Math.min(...e.ticketTypes.map(t => t.price));
    return m === 0 ? "Free" : `From €${m}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 fill-brand-400 text-brand-400" /> Saved Events
        </h1>
        <p className="text-white/40 mb-8">Events you bookmarked</p>

        {loading ? (
          <div className="text-center py-16 text-white/30">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 border border-white/5 rounded-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white/60 mb-2">No saved events</h3>
            <p className="text-white/30 mb-6">Tap the heart on any event to save it here</p>
            <Link href="/events" className="inline-flex bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 transition-colors">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(e => (
              <Link key={e.id} href={`/events/${e.id}`} className="block bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-brand-500/30 transition-all">
                <div className="flex gap-4">
                  {e.coverImageUrl && (
                    <img src={e.coverImageUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{e.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-white/40 mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(e.startDate).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      {(e.venue || e.city) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {[e.venue, e.city].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-brand-400">{minPrice(e)}</span>
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
