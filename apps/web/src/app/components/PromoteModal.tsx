"use client";

import { useState } from "react";
import { X, Copy, Check, Download, MessageCircle } from "lucide-react";
import QRCode from "./QRCode";

// Share tools for a promoter's tracked link.
export default function PromoteModal({
  open, onClose, eventTitle, link, commissionRate,
}: { open: boolean; onClose: () => void; eventTitle: string; link: string; commissionRate?: number }) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const caption = `🎟️ Get your tickets for ${eventTitle}! Grab them here 👉 ${link}`;
  const enc = encodeURIComponent(caption);
  const encLink = encodeURIComponent(link);

  const shares = [
    { name: "WhatsApp", color: "bg-[#25D366]", href: `https://wa.me/?text=${enc}` },
    { name: "X / Twitter", color: "bg-black border border-white/20", href: `https://twitter.com/intent/tweet?text=${enc}` },
    { name: "Facebook", color: "bg-[#1877F2]", href: `https://www.facebook.com/sharer/sharer.php?u=${encLink}` },
    { name: "Telegram", color: "bg-[#0088cc]", href: `https://t.me/share/url?url=${encLink}&text=${encodeURIComponent("🎟️ " + eventTitle)}` },
  ];

  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  function downloadQR() {
    const canvas = document.querySelector("#promote-qr canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${eventTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-promo-qr.png`;
    a.click();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><MessageCircle className="w-5 h-5 text-brand-400" /> Promote & Earn</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {commissionRate ? <p className="text-xs text-brand-400 mb-4">Earn {commissionRate}% on every ticket sold through your link.</p> : <div className="mb-4" />}

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {shares.map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
              className={`${s.color} text-white text-sm font-semibold py-3 rounded-xl text-center hover:opacity-90 transition-opacity`}>
              {s.name}
            </a>
          ))}
        </div>

        {/* Copy link */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 mb-4">
          <span className="text-xs text-white/50 truncate flex-1 px-2">{link}</span>
          <button onClick={copy} className="bg-brand-500 text-black px-3 py-2 rounded-lg text-sm font-semibold hover:bg-brand-400 transition-colors flex items-center gap-1.5 shrink-0">
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
        </div>

        {/* QR code */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
          <p className="text-xs text-white/40 mb-3">Or share this QR code on flyers & posters</p>
          <div id="promote-qr" className="inline-block bg-white p-3 rounded-xl">
            <QRCode value={link} size={160} />
          </div>
          <button onClick={downloadQR} className="mt-3 w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" /> Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
