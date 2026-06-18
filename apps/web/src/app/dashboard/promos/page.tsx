"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Trash2, Tag } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Promo {
  id: string;
  code: string;
  percentOff: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  eventId: string | null;
}

export default function PromosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <PromosInner />
    </Suspense>
  );
}

function PromosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const eventTitle = searchParams.get("title") || "";
  const [token, setToken] = useState("");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState(10);
  const [maxUses, setMaxUses] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t) { router.push("/login"); return; }
    if (u && JSON.parse(u).role !== "ORGANIZER") { router.push("/events"); return; }
    setToken(t);
    load(t);
  }, [router]);

  async function load(t: string) {
    const res = await fetch(`${API_URL}/api/organizer/promos`, { headers: { Authorization: `Bearer ${t}` } });
    const d = await res.json();
    // When scoped to an event, show that event's codes (+ org-wide codes that apply everywhere).
    const all = d.data || [];
    setPromos(eventId ? all.filter((p: any) => p.eventId === eventId || p.eventId === null) : all);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch(`${API_URL}/api/organizer/promos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, percentOff: Number(percentOff), maxUses: maxUses ? Number(maxUses) : undefined, eventId: eventId || undefined }),
    });
    const d = await res.json();
    if (d.success) { setCode(""); setMaxUses(""); setPercentOff(10); load(token); }
    else setMsg(d.error || "Failed");
  }

  async function remove(id: string) {
    await fetch(`${API_URL}/api/organizer/promos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load(token);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-semibold text-white">Promo Codes</h1>
            {eventTitle && <p className="text-xs text-brand-400 mt-0.5">For: {eventTitle}</p>}
          </div>
        </div>

        <form onSubmit={create} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Create a code</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-xs text-white/40 mb-1">Code</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required placeholder="SUMMER20"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">% Off</label>
              <input type="number" min={1} max={100} value={percentOff} onChange={e => setPercentOff(Number(e.target.value))} required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Max uses</label>
              <input type="number" min={1} value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="∞"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          {msg && <p className="text-xs text-red-400 mt-2">{msg}</p>}
          <button className="mt-4 bg-brand-500 text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-400 transition-colors">Create code</button>
        </form>

        <div className="space-y-2">
          {promos.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No promo codes yet</p>
          ) : promos.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <Tag className="w-4 h-4 text-brand-400 shrink-0" />
              <div className="flex-1">
                <span className="text-white font-mono font-semibold">{p.code}</span>
                <span className="text-brand-400 text-sm ml-3">{p.percentOff}% off</span>
              </div>
              <span className="text-xs text-white/40">{p.usedCount}{p.maxUses ? `/${p.maxUses}` : ""} used</span>
              <button onClick={() => remove(p.id)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
