"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Ticket, Calendar, TrendingUp, LogOut } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Event {
  id: string;
  title: string;
  status: string;
  startDate: string;
  totalCapacity: number;
  ticketTypes: { sold: number; quantity: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<{ firstName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!stored || !token) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
    fetchMyEvents(token);
  }, [router]);

  async function fetchMyEvents(token: string) {
    try {
      const res = await fetch(`${API_URL}/api/events/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.data || []);
      }
    } catch {
      // API might not have /my endpoint yet
    }
    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  }

  const totalSold = events.reduce((acc, e) => acc + e.ticketTypes.reduce((s, t) => s + t.sold, 0), 0);

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
          <div className="flex items-center gap-4">
            <Link href="/dashboard/create" className="bg-brand-500 text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-400 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
            <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back{user ? `, ${user.firstName}` : ""} 👋
          </h1>
          <p className="text-white/40">Here&apos;s your event overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Events" value={String(events.length)} />
          <StatCard icon={<Ticket className="w-5 h-5" />} label="Tickets Sold" value={String(totalSold)} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Revenue" value="€0" />
          <StatCard icon={<Ticket className="w-5 h-5" />} label="Active" value={String(events.filter(e => e.status === "PUBLISHED").length)} />
        </div>

        {/* Events List */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Your Events</h2>
          <Link href="/dashboard/create" className="text-brand-400 text-sm font-medium hover:text-brand-300 transition-colors">
            + New Event
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/30">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 border border-white/5 rounded-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white/60 mb-2">No events yet</h3>
            <p className="text-white/30 mb-6">Create your first event and start selling tickets</p>
            <Link href="/dashboard/create" className="inline-flex bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 transition-colors items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const sold = event.ticketTypes.reduce((s, t) => s + t.sold, 0);
              const total = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);
              const pct = total > 0 ? Math.round((sold / total) * 100) : 0;
              return (
                <Link key={event.id} href={`/dashboard/events/${event.id}`} className="block bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-brand-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                      <p className="text-white/30 text-sm">
                        {new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${event.status === "PUBLISHED" ? "bg-brand-500/10 text-brand-400" : "bg-white/5 text-white/40"}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/40">{sold}/{total} tickets</span>
                      <span className="text-white/40">{pct}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
      <div className="text-brand-400 mb-3">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/30">{label}</div>
    </div>
  );
}
