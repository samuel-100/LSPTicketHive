"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

// Worldwide city autocomplete via Photon (OpenStreetMap, no API key).
export default function CitySearch({ value, onChange, placeholder = "Search your city…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<{ name: string; label: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`);
        const data = await res.json();
        if (cancelled) return;
        const seen = new Set<string>();
        const opts = (data.features || [])
          .map((f: any) => {
            const p = f.properties || {};
            const name = p.name || p.city || p.county || p.state || "";
            const parts = [name, p.state && p.state !== name ? p.state : null, p.country].filter(Boolean);
            return { name, label: parts.join(", ") };
          })
          .filter((o: any) => o.name && !seen.has(o.label) && seen.add(o.label));
        setSuggestions(opts);
      } catch { if (!cancelled) setSuggestions([]); }
      if (!cancelled) setLoading(false);
    }, 280);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(name: string) {
    setQuery(name);
    onChange(name);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus-within:border-brand-500 transition-colors">
        <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent text-white placeholder:text-white/20 focus:outline-none w-full text-sm"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50">
          {loading && suggestions.length === 0 && <div className="px-4 py-3 text-sm text-white/30">Searching…</div>}
          {!loading && suggestions.length === 0 && <div className="px-4 py-3 text-sm text-white/30">No places found</div>}
          {suggestions.map((s, i) => (
            <button key={`${s.label}-${i}`} type="button" onClick={() => pick(s.name)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
              <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
              <span className="text-sm text-white/80 truncate">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
