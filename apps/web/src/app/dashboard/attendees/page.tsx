"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import QRCode from "../../components/QRCode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Found {
  ticketId: string;
  qrCode: string;
  status: string;
  checkedInAt: string | null;
  attendee: { firstName: string; lastName: string; email: string; avatarUrl?: string };
  ticketType: string;
  eventTitle: string;
  eventDate: string;
}

export default function AttendeeLookupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <AttendeeInner />
    </Suspense>
  );
}

function AttendeeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const eventTitle = searchParams.get("title") || "";
  const [token, setToken] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Found[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [openQr, setOpenQr] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t) { router.push("/login"); return; }
    if (u) {
      const parsed = JSON.parse(u);
      if (parsed.role !== "ORGANIZER") { router.push("/events"); return; }
    }
    setToken(t);
  }, [router]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/checkin/lookup?q=${encodeURIComponent(q.trim())}${eventId ? `&eventId=${eventId}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data.success ? data.data : []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">Find an Attendee</h1>
            {eventTitle && <p className="text-xs text-brand-400 mt-0.5">For: {eventTitle}</p>}
          </div>
        </div>
        <p className="text-white/40 text-sm mb-6">
          Search by name or email to find someone&apos;s ticket — useful if they lost access to their phone or email.{eventTitle ? "" : " Showing all your events."}
        </p>

        <form onSubmit={search} className="flex gap-2 mb-6">
          <div className="flex items-center flex-1 bg-white/5 border border-white/10 rounded-xl px-4">
            <Search className="w-4 h-4 text-white/30 shrink-0" />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Name, email, or ticket ID…"
              className="flex-1 bg-transparent px-3 py-3 text-white placeholder:text-white/20 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || q.trim().length < 2}
            className="bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors"
          >
            {loading ? "…" : "Search"}
          </button>
        </form>

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-12 text-white/30">No tickets found for &quot;{q}&quot;</div>
        )}

        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.ticketId} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  {r.attendee.avatarUrl ? (
                    <img src={r.attendee.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : (
                    <span className="text-brand-400 font-bold text-sm">{r.attendee.firstName?.[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{r.attendee.firstName} {r.attendee.lastName}</p>
                  <p className="text-white/30 text-xs truncate">{r.attendee.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${r.status === "USED" ? "bg-orange-400/10 text-orange-400" : "bg-brand-500/10 text-brand-400"}`}>
                  {r.status === "USED" ? "Checked in" : "Valid"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-white/30">Event</span><div className="text-white/70">{r.eventTitle}</div></div>
                <div><span className="text-white/30">Ticket</span><div className="text-white/70">{r.ticketType}</div></div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <code className="text-[10px] text-white/40 font-mono break-all">{r.qrCode}</code>
                <button
                  onClick={() => setOpenQr(openQr === r.ticketId ? null : r.ticketId)}
                  className="shrink-0 text-xs bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {openQr === r.ticketId ? "Hide QR" : "Show QR"}
                </button>
              </div>

              {openQr === r.ticketId && (
                <div className="mt-3 bg-white rounded-xl p-4 flex justify-center">
                  <QRCode value={r.qrCode} size={180} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
