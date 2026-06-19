"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Ticket, CheckCircle, Calendar, MapPin } from "lucide-react";
import { Suspense } from "react";
import QRCode from "../../components/QRCode";

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
  const [refunding, setRefunding] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share — I'm going!");
  const [transferFor, setTransferFor] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferMsg, setTransferMsg] = useState("");

  async function doTransfer() {
    if (!transferEmail.trim()) { setTransferMsg("Enter the recipient's email"); return; }
    setTransferMsg("Transferring…");
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/orders/tickets/${transferFor}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: transferEmail.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setTransferMsg(`Sent to ${transferEmail}! They now own this ticket.`);
      setTimeout(() => { setTransferFor(null); setTransferEmail(""); setTransferMsg(""); window.location.reload(); }, 2000);
    } else {
      setTransferMsg(data.error || "Transfer failed");
    }
  }

  async function shareGoing() {
    const url = window.location.origin;
    const data = { title: order?.event.title || "Event", text: `I'm going to ${order?.event.title}! 🎉 Get tickets on LSPTicketHive`, url };
    if ((navigator as any).share) {
      try { await (navigator as any).share(data); return; } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(`I'm going to ${order?.event.title}! ${url}`);
      setShareLabel("Copied!");
      setTimeout(() => setShareLabel("Share — I'm going!"), 2000);
    } catch { /* ignore */ }
  }

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

  async function requestRefund() {
    if (!confirm("Request a refund for this order? Your tickets will be cancelled.")) return;
    setRefunding(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/orders/${params.id}/refund`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setOrder(o => o ? { ...o, status: "REFUNDED" } : o);
      alert("Refund processed. You'll see it back on your card in a few days.");
    } else {
      alert(data.error || "Refund failed");
    }
    setRefunding(false);
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>;
  if (!order) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Order not found</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

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
              <div className="text-sm text-white/40 mb-3">Ticket {i + 1} — {ticket.ticketType.name}</div>
              <div className="bg-white rounded-xl p-4 inline-block mb-3">
                <QRCode value={ticket.qrCode} size={180} />
              </div>
              <div className="text-xs text-white/20 font-mono mt-2">{ticket.qrCode}</div>
              {order.status === "COMPLETED" && (
                <button
                  onClick={() => setTransferFor(ticket.id)}
                  className="mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors print:hidden"
                >
                  Transfer this ticket →
                </button>
              )}
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

        {/* Actions */}
        <div className="mt-4 flex gap-2 print:hidden">
          <button
            onClick={shareGoing}
            className="flex-1 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
          >
            {shareLabel}
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Receipt
          </button>
          {order.status === "COMPLETED" && (
            <button
              onClick={requestRefund}
              disabled={refunding}
              className="flex-1 bg-white/5 border border-red-500/20 text-red-400 py-2.5 rounded-xl text-sm font-medium hover:bg-red-500/10 disabled:opacity-50 transition-colors"
            >
              {refunding ? "Processing…" : "Request Refund"}
            </button>
          )}
          {order.status === "REFUNDED" && (
            <div className="flex-1 text-center py-2.5 text-sm text-white/40">Refunded</div>
          )}
        </div>
      </div>

      {/* Transfer modal */}
      {transferFor && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 print:hidden" onClick={() => setTransferFor(null)}>
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-1">Transfer ticket</h2>
            <p className="text-xs text-white/40 mb-4">The recipient needs an LSPTicketHive account. A fresh QR code is emailed to them and your copy stops working.</p>
            <input
              type="email"
              value={transferEmail}
              onChange={e => setTransferEmail(e.target.value)}
              placeholder="recipient@email.com"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 mb-3"
            />
            {transferMsg && <p className="text-xs text-brand-400 mb-3">{transferMsg}</p>}
            <div className="flex gap-2">
              <button onClick={() => setTransferFor(null)} className="flex-1 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10 text-white/60">Cancel</button>
              <button onClick={doTransfer} className="flex-1 py-2.5 rounded-lg text-sm bg-brand-500 text-black font-semibold hover:bg-brand-400 transition-colors">Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>}>
      <OrderContent />
    </Suspense>
  );
}
