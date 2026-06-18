"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Megaphone, TrendingUp, Calendar, MapPin, Share2 } from "lucide-react";
import PromoteModal from "../components/PromoteModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface MEvent {
  id: string; title: string; coverImageUrl?: string; city?: string; venue?: string;
  startDate: string; category?: string; commissionRate: number; minPrice: number; maxPrice: number;
  exampleEarn: number; organization: { name: string };
}

export default function PromotePage() {
  const [events, setEvents] = useState<MEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [promoteEvent, setPromoteEvent] = useState<MEvent | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      const parsed = JSON.parse(u);
      if (parsed.role === "ORGANIZER") { window.location.href = "/dashboard"; return; }
      setMe(parsed);
    }
    fetch(`${API_URL}/api/promoter/marketplace`)
      .then(r => r.json()).then(d => { setEvents(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function openPromote(e: MEvent) {
    if (!me) { window.location.href = "/login"; return; }
    setPromoteEvent(e);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto px-6 py-14 relative">
          <div className="inline-flex items-center gap-2 bg-brand-500/15 text-brand-400 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <Megaphone className="w-3.5 h-3.5" /> Promote & Earn
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Earn money sharing events</h1>
          <p className="text-white/50 text-lg max-w-2xl">Grab your unique link for any event below. Every ticket someone buys through your link earns you commission — paid automatically.</p>
          {me && (
            <Link href="/promote/earnings" className="inline-flex items-center gap-2 mt-5 bg-brand-500 text-black px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-400 transition-colors">
              <TrendingUp className="w-4 h-4" /> My earnings
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-white mb-6">Events open for promotion</h2>
        {loading ? (
          <div className="text-center py-16 text-white/30">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No events open for promotion yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e, i) => (
              <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-500/30 transition-colors">
                <Link href={`/events/${e.id}`}>
                  <div className="h-36 relative overflow-hidden">
                    {e.coverImageUrl ? <img src={e.coverImageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-brand-700/10" />}
                    <div className="absolute top-3 right-3 bg-brand-500 text-black text-xs font-bold px-2.5 py-1 rounded-full">{e.commissionRate}% commission</div>
                  </div>
                </Link>
                <div className="p-4">
                  <h3 className="font-semibold text-white truncate">{e.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-white/40 mt-1">
                    <Calendar className="w-3 h-3" />{new Date(e.startDate).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                    {e.city && <><MapPin className="w-3 h-3 ml-1" />{e.city}</>}
                  </div>
                  <div className="mt-3 mb-3 bg-brand-500/10 rounded-lg px-3 py-2">
                    <div className="text-xs text-white/40">Earn up to</div>
                    <div className="text-brand-400 font-bold">€{e.exampleEarn.toFixed(2)} <span className="text-white/30 font-normal text-xs">per ticket</span></div>
                  </div>
                  <button onClick={() => openPromote(e)} className="w-full flex items-center justify-center gap-2 bg-brand-500 text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-400 transition-colors">
                    <Share2 className="w-4 h-4" /> Promote this
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <PromoteModal
        open={!!promoteEvent}
        onClose={() => setPromoteEvent(null)}
        eventTitle={promoteEvent?.title || ""}
        link={promoteEvent && me ? `${window.location.origin}/events/${promoteEvent.id}?ref=${me.id}` : ""}
        commissionRate={promoteEvent?.commissionRate}
      />
    </div>
  );
}
