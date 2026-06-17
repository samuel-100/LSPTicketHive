"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Camera, Keyboard } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ScanPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; ticket?: any } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t && !u) { router.push("/login"); return; }
    if (t) setToken(t);
  }, [router]);

  useEffect(() => {
    if (mode === "camera" && !cameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode]);

  async function startCamera() {
    if (typeof window === "undefined") return;
    const { Html5Qrcode } = await import("html5-qrcode");

    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
    }

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          handleScan(decodedText);
          scanner.pause();
          setTimeout(() => {
            try { scanner.resume(); } catch {}
          }, 3000);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setMode("manual");
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
      setCameraActive(false);
    }
  }

  async function handleScan(code?: string) {
    const qr = code || qrInput.trim();
    if (!qr || scanning) return;
    setScanning(true);
    setResult(null);

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/checkin/scan`, {
        method: "POST",
        headers,
        credentials: "include",
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
      <div className="max-w-xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-white">Scan Tickets</h1>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${mode === "camera" ? "bg-brand-500 text-black" : "bg-white/5 text-white/40 border border-white/10"}`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => { stopCamera(); setMode("manual"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${mode === "manual" ? "bg-brand-500 text-black" : "bg-white/5 text-white/40 border border-white/10"}`}
          >
            <Keyboard className="w-4 h-4" />
            Manual
          </button>
        </div>

        {/* Camera View */}
        {mode === "camera" && (
          <div className="bg-black rounded-2xl overflow-hidden mb-6">
            <div id="qr-reader" className="w-full" style={{ minHeight: "300px" }} />
            {!cameraActive && (
              <div className="flex items-center justify-center h-72 text-white/30 text-sm">
                Starting camera...
              </div>
            )}
          </div>
        )}

        {/* Manual Input */}
        {mode === "manual" && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
            <p className="text-white/40 text-sm mb-4">Enter the ticket code shown below the QR code</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScan()}
                placeholder="Enter ticket code..."
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
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-2xl p-6 text-center mb-6 ${result.success ? "bg-brand-500/10 border border-brand-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
            <div className="flex justify-center mb-3">
              {result.success ? (
                <CheckCircle className="w-14 h-14 text-brand-400" />
              ) : (
                <XCircle className="w-14 h-14 text-red-400" />
              )}
            </div>
            <h3 className={`text-xl font-bold mb-1 ${result.success ? "text-brand-400" : "text-red-400"}`}>
              {result.success ? "Valid Ticket ✓" : "Invalid"}
            </h3>
            <p className="text-white/40">{result.message}</p>
            {result.ticket && (
              <div className="mt-3 text-sm text-white/30">
                <p className="font-medium text-white/50">{result.ticket.attendee?.firstName} {result.ticket.attendee?.lastName}</p>
                <p>{result.ticket.ticketType} — {result.ticket.eventTitle}</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
          <h3 className="font-medium text-white text-sm mb-2">How to check in</h3>
          <ul className="space-y-1.5 text-xs text-white/40">
            <li>• Point camera at the attendee&apos;s QR code</li>
            <li>• Or type the code below the QR manually</li>
            <li>• Green = valid entry, Red = already used or invalid</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
