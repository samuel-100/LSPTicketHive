"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, MessageCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function FindPromotersPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [q, setQ] = useState("");
  const [promoters, setPromoters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t) { router.push("/login"); return; }
    if (u && JSON.parse(u).role !== "ORGANIZER") { router.push("/events"); return; }
    setToken(t);
    load(t, "");
  }, [router]);

  async function load(t: string, query: string) {
    setLoading(true);
    const d = await fetch(`${API_URL}/api/messages/promoters/search?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json());
    setPromoters(d.data || []);
    setLoading(false);
  }

  async function message(id: string) {
    const res = await fetch(`${API_URL}/api/messages/start`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: id, body: "Hi! We'd love you to promote our events." }),
    });
    const d = await res.json();
    if (d.success) router.push(`/messages?c=${d.data.conversationId}`);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-semibold text-white">Find Promoters</h1>
        </div>
        <p className="text-white/40 text-sm mb-6">Search promoters by name or interest, then message them to promote your events.</p>

        <form onSubmit={e => { e.preventDefault(); load(token, q); }} className="flex gap-2 mb-6">
          <div className="flex items-center flex-1 bg-white/5 border border-white/10 rounded-xl px-4">
            <Search className="w-4 h-4 text-white/30 shrink-0" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Name or interest (e.g. Music)…" className="flex-1 bg-transparent px-3 py-3 text-white placeholder:text-white/20 focus:outline-none" />
          </div>
          <button className="bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 transition-colors">Search</button>
        </form>

        {loading ? (
          <div className="text-center py-16 text-white/30">Loading...</div>
        ) : promoters.length === 0 ? (
          <div className="text-center py-16 text-white/30">No promoters found</div>
        ) : (
          <div className="space-y-3">
            {promoters.map(p => (
              <div key={p.id} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="w-11 h-11 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : <span className="text-brand-400 font-bold">{p.firstName?.[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium">{p.firstName} {p.lastName}</div>
                  {p.promoterInterests?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.promoterInterests.slice(0, 4).map((i: string) => <span key={i} className="text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded-full">{i}</span>)}
                    </div>
                  )}
                </div>
                <button onClick={() => message(p.id)} className="flex items-center gap-1.5 bg-brand-500 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-400 transition-colors shrink-0">
                  <MessageCircle className="w-4 h-4" /> Message
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
