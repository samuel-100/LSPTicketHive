"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Users, Calendar, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Promoter {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  eventCount: number;
  followers: number;
}

export default function PromotersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <PromotersInner />
    </Suspense>
  );
}

function PromotersInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [input, setInput] = useState(searchParams.get("city") || "");
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city.trim()) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API_URL}/api/organizations/by-city?city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(d => { setPromoters(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [city]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    setCity(input.trim());
    router.push(`/promoters?city=${encodeURIComponent(input.trim())}`);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Promoters {city && `in ${city}`}</h1>
        <p className="text-white/40 mb-6">Discover event organizers near you</p>

        <form onSubmit={search} className="flex gap-2 mb-8 max-w-md">
          <div className="flex items-center flex-1 bg-white/5 border border-white/10 rounded-xl px-4">
            <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter a city…" className="flex-1 bg-transparent px-3 py-3 text-white placeholder:text-white/20 focus:outline-none" />
          </div>
          <button className="bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 transition-colors">Search</button>
        </form>

        {loading ? (
          <div className="text-center py-16 text-white/30">Loading...</div>
        ) : !city.trim() ? (
          <div className="text-center py-16 text-white/30">Enter a city to find promoters</div>
        ) : promoters.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No promoters with upcoming events in {city} yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {promoters.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-brand-500/30 transition-colors h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.logoUrl ? <img src={p.logoUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-brand-400 font-bold text-lg">{p.name[0]}</span>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{p.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.eventCount} event{p.eventCount !== 1 ? "s" : ""}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.followers}</span>
                      </div>
                    </div>
                  </div>
                  {p.description && <p className="text-sm text-white/40 line-clamp-2 mb-3">{p.description}</p>}
                  <Link href={`/events?city=${encodeURIComponent(city)}`} className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                    See their events →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
