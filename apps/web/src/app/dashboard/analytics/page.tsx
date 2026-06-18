"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Ticket, Banknote } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Analytics {
  totalRevenue: number;
  totalSold: number;
  totalOrders: number;
  series: { date: string; revenue: number; sold: number }[];
  topEvents: { title: string; revenue: number; sold: number }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (u && JSON.parse(u).role !== "ORGANIZER") { router.push("/events"); return; }
    fetch(`${API_URL}/api/organizer/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const maxRev = data?.series.length ? Math.max(...data.series.map(s => s.revenue), 1) : 1;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-white">Sales Analytics</h1>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/30">Loading...</div>
        ) : !data ? (
          <div className="text-center py-16 text-white/30">No data yet</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Stat icon={<Banknote className="w-5 h-5" />} label="Revenue" value={`€${data.totalRevenue.toFixed(2)}`} />
              <Stat icon={<Ticket className="w-5 h-5" />} label="Tickets Sold" value={String(data.totalSold)} />
              <Stat icon={<TrendingUp className="w-5 h-5" />} label="Orders" value={String(data.totalOrders)} />
            </div>

            {/* Revenue chart */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8">
              <h2 className="text-sm font-semibold text-white mb-5">Revenue over time</h2>
              {data.series.length === 0 ? (
                <p className="text-white/30 text-sm py-8 text-center">No sales yet</p>
              ) : (
                <div className="flex items-end gap-1.5 h-48">
                  {data.series.map(s => (
                    <div key={s.date} className="flex-1 flex flex-col items-center justify-end group" title={`${s.date}: €${s.revenue} (${s.sold} sold)`}>
                      <div
                        className="w-full bg-brand-500/70 hover:bg-brand-400 rounded-t transition-colors"
                        style={{ height: `${Math.max(4, (s.revenue / maxRev) * 100)}%` }}
                      />
                      <span className="text-[9px] text-white/30 mt-1 rotate-0">{s.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top events */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Top events by revenue</h2>
              {data.topEvents.length === 0 ? (
                <p className="text-white/30 text-sm">No sales yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topEvents.map((e, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-white/70">{e.title}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-white/40">{e.sold} sold</span>
                        <span className="text-brand-400 font-medium w-20 text-right">€{e.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
      <div className="text-brand-400 mb-3">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/30">{label}</div>
    </div>
  );
}
