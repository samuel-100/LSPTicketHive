"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Phone } from "lucide-react";

// Common countries first, then a broad list. Flag = emoji from ISO code.
const COUNTRIES: { code: string; dial: string; name: string }[] = [
  { code: "IE", dial: "+353", name: "Ireland" },
  { code: "GB", dial: "+44", name: "United Kingdom" },
  { code: "US", dial: "+1", name: "United States" },
  { code: "NG", dial: "+234", name: "Nigeria" },
  { code: "GH", dial: "+233", name: "Ghana" },
  { code: "SL", dial: "+232", name: "Sierra Leone" },
  { code: "CA", dial: "+1", name: "Canada" },
  { code: "DE", dial: "+49", name: "Germany" },
  { code: "FR", dial: "+33", name: "France" },
  { code: "ES", dial: "+34", name: "Spain" },
  { code: "IT", dial: "+39", name: "Italy" },
  { code: "NL", dial: "+31", name: "Netherlands" },
  { code: "PT", dial: "+351", name: "Portugal" },
  { code: "BE", dial: "+32", name: "Belgium" },
  { code: "SE", dial: "+46", name: "Sweden" },
  { code: "NO", dial: "+47", name: "Norway" },
  { code: "DK", dial: "+45", name: "Denmark" },
  { code: "PL", dial: "+48", name: "Poland" },
  { code: "AU", dial: "+61", name: "Australia" },
  { code: "ZA", dial: "+27", name: "South Africa" },
  { code: "KE", dial: "+254", name: "Kenya" },
  { code: "AE", dial: "+971", name: "UAE" },
  { code: "IN", dial: "+91", name: "India" },
  { code: "BR", dial: "+55", name: "Brazil" },
  { code: "CN", dial: "+86", name: "China" },
  { code: "JP", dial: "+81", name: "Japan" },
];

function flagEmoji(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Parse a stored value like "+353 871234567" into {dial, number}.
function parse(value: string): { dial: string; number: string } {
  const v = (value || "").trim();
  const match = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length).find(c => v.startsWith(c.dial));
  if (match) return { dial: match.dial, number: v.slice(match.dial.length).trim() };
  return { dial: "+353", number: v.replace(/^\+/, "") };
}

export default function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const initial = parse(value);
  const [dial, setDial] = useState(initial.dial);
  const [number, setNumber] = useState(initial.number);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find(c => c.dial === dial) || COUNTRIES[0];

  useEffect(() => {
    onChange(number ? `${dial} ${number}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dial, number]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-2 px-2 py-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-brand-500 transition-colors">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
      >
        <span className="text-lg leading-none">{flagEmoji(selected.code)}</span>
        <span className="text-sm text-white/70">{selected.dial}</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/40" />
      </button>
      <div className="w-px h-5 bg-white/10" />
      <Phone className="w-4 h-4 text-brand-400 shrink-0" />
      <input
        type="tel"
        value={number}
        onChange={e => setNumber(e.target.value.replace(/[^\d\s]/g, ""))}
        placeholder="Phone number"
        className="bg-transparent text-white placeholder:text-white/20 focus:outline-none w-full text-sm"
      />

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50">
          {COUNTRIES.map(c => (
            <button
              key={c.code + c.dial}
              type="button"
              onClick={() => { setDial(c.dial); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-lg leading-none">{flagEmoji(c.code)}</span>
              <span className="text-sm text-white/80 flex-1">{c.name}</span>
              <span className="text-sm text-white/40">{c.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
