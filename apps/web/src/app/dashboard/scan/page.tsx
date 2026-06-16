"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ticket, CheckCircle, XCircle, Camera } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ScanPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; ticket?: any } | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
  }, [router]);

  async function handleScan(code?: string) {
    const qr = code || qrInput.trim();
    if (!qr) return;
    setScanning(true);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/checkin/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qrCode: qr }),
      });
      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: "Checked in!", ticket: data.data });
      } else {
        setResult({ success: false, message: data.error || "Invalid ticket" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    }
    setScanning(false);
    setQrInput("");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Scan Tickets</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Camera placeholder */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center mb-6">
          <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">QR Scanner</h2>
          <p className="text-white/30 text-sm mb-6">Enter ticket code manually or scan with camera</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScan()}
              placeholder="Enter QR code or ticket ID..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button
              onClick={() => handleScan()}
              disabled={scanning || !qrInput.trim()}
              className="bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {scanning ? "..." : "Check In"}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl p-6 text-center ${result.success ? "bg-brand-500/10 border border-brand-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
            <div className="flex justify-center mb-3">
              {result.success ? (
                <CheckCircle className="w-12 h-12 text-brand-400" />
              ) : (
                <XCircle className="w-12 h-12 text-red-400" />
              )}
            </div>
            <h3 className={`text-xl font-bold mb-1 ${result.success ? "text-brand-400" : "text-red-400"}`}>
              {result.success ? "Valid Ticket" : "Invalid"}
            </h3>
            <p className="text-white/40">{result.message}</p>
            {result.ticket && (
              <div className="mt-3 text-sm text-white/30">
                <p>{result.ticket.ticketType?.name}</p>
                <p>{result.ticket.user?.firstName} {result.ticket.user?.lastName}</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-3">How to scan</h3>
          <ul className="space-y-2 text-sm text-white/40">
            <li>1. Ask attendee to show their QR code</li>
            <li>2. Enter the code below the QR or use camera</li>
            <li>3. Green = valid, Red = already used or invalid</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
