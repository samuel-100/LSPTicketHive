"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Ticket, ShoppingBag } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function PromoterEarningsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    const u = localStorage.getItem("user");
    if (u && JSON.parse(u).role === "ORGANIZER") { router.push("/dashboard"); return; }
    fetch(`${API_URL}/api/promoter/earnings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/promote" className="text-white/40 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-semibold text-white">My Promoter Earnings</h1>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/30">Loading...</div>
        ) : !data ? (
          <div className="text-center py-16 text-white/30">No data</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Stat icon={<Banknote className="w-5 h-5" />} label="Earned" value={`€${data.totalEarned.toFixed(2)}`} accent />
              <Stat icon={<Ticket className="w-5 h-5" />} label="Tickets Sold" value={String(data.totalSold)} />
              <Stat icon={<ShoppingBag className="w-5 h-5" />} label="Orders" value={String(data.totalOrders)} />
            </div>

            <h2 className="text-sm font-semibold text-white mb-4">Events you&apos;ve promoted</h2>
            {data.events.length === 0 ? (
              <div className="text-center py-12 border border-white/5 rounded-2xl">
                <p className="text-white/40 mb-4">You haven&apos;t earned yet. Grab a link and start sharing!</p>
                <Link href="/promote" className="inline-flex bg-brand-500 text-black px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-400 transition-colors">Browse events to promote</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.events.map((e: any) => (
                  <Link key={e.event.id} href={`/events/${e.event.id}`} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-brand-500/30 transition-colors">
                    {e.event.coverImageUrl && <img src={e.event.coverImageUrl} className="w-14 h-14 rounded-lg object-cover" alt="" />}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{e.event.title}</h3>
                      <p className="text-xs text-white/40">{e.sold} ticket{e.sold !== 1 ? "s" : ""} · {e.orders} order{e.orders !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-brand-400 font-bold">€{e.earned.toFixed(2)}</div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "bg-gradient-to-br from-brand-500/15 to-transparent border-brand-500/20" : "bg-white/[0.02] border-white/5"}`}>
      <div className="text-brand-400 mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/30">{label}</div>
    </div>
  );
}
