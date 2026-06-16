"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Ticket, CheckCircle, Calendar, MapPin } from "lucide-react";
import { Suspense } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface OrderData {
  id: string;
  total: number;
  status: string;
  event: { title: string; startDate: string; venue: string; coverImageUrl?: string };
  tickets: { id: string; qrCode: string; ticketType: { name: string } }[];
}

function OrderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setOrder(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>;
  if (!order) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Order not found</div>;

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
          <Link href="/tickets" className="text-brand-400 text-sm font-medium">My Tickets</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {isSuccess && (
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-brand-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">You&apos;re in!</h1>
            <p className="text-white/40">Your tickets are confirmed. Show the QR code at the door.</p>
          </div>
        )}

        {/* Event Info */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white text-lg mb-3">{order.event.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-white/40">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              {new Date(order.event.startDate).toLocaleDateString("en-IE", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            {order.event.venue && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-400" />
                {order.event.venue}
              </span>
            )}
          </div>
        </div>

        {/* Tickets with QR Codes */}
        <h2 className="text-xl font-semibold text-white mb-4">Your Tickets ({order.tickets.length})</h2>
        <div className="space-y-4">
          {order.tickets.map((ticket, i) => (
            <div key={ticket.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center">
              <div className="text-sm text-white/40 mb-2">Ticket {i + 1} — {ticket.ticketType.name}</div>
              <div className="bg-white rounded-xl p-4 inline-block mb-3">
                <QRCode value={ticket.qrCode} />
              </div>
              <div className="text-xs text-white/20 font-mono">{ticket.qrCode}</div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="mt-6 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/40">Order ID</span>
            <span className="text-white/60 font-mono text-xs">{order.id}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/40">Status</span>
            <span className="text-brand-400 font-medium">{order.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Total</span>
            <span className="text-white font-semibold">€{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QRCode({ value }: { value: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-40 h-40">
      <rect width="100" height="100" fill="white" />
      <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#333">
        {value.substring(0, 12)}
      </text>
      <text x="50" y="60" textAnchor="middle" fontSize="6" fill="#666">
        Scan at door
      </text>
      {/* Simple QR-like pattern */}
      <rect x="10" y="10" width="20" height="20" fill="#000" rx="2" />
      <rect x="70" y="10" width="20" height="20" fill="#000" rx="2" />
      <rect x="10" y="70" width="20" height="20" fill="#000" rx="2" />
      <rect x="14" y="14" width="12" height="12" fill="white" />
      <rect x="74" y="14" width="12" height="12" fill="white" />
      <rect x="14" y="74" width="12" height="12" fill="white" />
      <rect x="17" y="17" width="6" height="6" fill="#000" />
      <rect x="77" y="17" width="6" height="6" fill="#000" />
      <rect x="17" y="77" width="6" height="6" fill="#000" />
      <rect x="35" y="35" width="30" height="30" fill="none" stroke="#000" strokeWidth="2" rx="3" />
      <text x="50" y="53" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#22c55e">TH</text>
    </svg>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>}>
      <OrderContent />
    </Suspense>
  );
}
