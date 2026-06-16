"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, Calendar, MapPin } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  event: { title: string; startDate: string; venue: string; coverImageUrl?: string };
  tickets: { id: string; ticketType: { name: string } }[];
}

export default function TicketsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/api/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setOrders(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-bold text-white">LSPTicketHive</span>
          </Link>
          <Link href="/events" className="text-white/40 text-sm hover:text-white transition-colors">Browse Events</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">My Tickets</h1>
        <p className="text-white/40 mb-8">All your upcoming events</p>

        {loading ? (
          <div className="text-center py-16 text-white/30">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 border border-white/5 rounded-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white/60 mb-2">No tickets yet</h3>
            <p className="text-white/30 mb-6">Browse events and get your first ticket</p>
            <Link href="/events" className="inline-flex bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 transition-colors">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-brand-500/30 transition-all">
                <div className="flex gap-4">
                  {order.event.coverImageUrl && (
                    <img src={order.event.coverImageUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{order.event.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-white/40 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.event.startDate).toLocaleDateString("en-IE", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      {order.event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {order.event.venue}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-brand-500/10 text-brand-400 px-2 py-1 rounded-full">
                        {order.tickets.length} ticket{order.tickets.length > 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-white/20">
                        {order.tickets.map(t => t.ticketType.name).join(", ")}
                      </span>
                    </div>
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
