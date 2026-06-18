"use client";

import { useEffect, useState, useRef } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";

type Mode = "light" | "dark" | "system";

function applyMode(mode: Mode) {
  const root = document.documentElement;
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("light", !dark);
  root.classList.toggle("dark", dark);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("dark");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Mode) || "dark";
    setMode(saved);
    applyMode(saved);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choose(m: Mode) {
    setMode(m);
    localStorage.setItem("theme", m);
    applyMode(m);
    setOpen(false);
  }

  const Icon = mode === "light" ? Sun : mode === "system" ? Monitor : Moon;
  const opts: { key: Mode; label: string; icon: any }[] = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Monitor },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="Theme" className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
        <Icon className="w-4.5 h-4.5 w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]">
          {opts.map(o => {
            const O = o.icon;
            return (
              <button key={o.key} onClick={() => choose(o.key)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                <O className="w-4 h-4 text-brand-400" />
                <span className="text-sm text-white flex-1">{o.label}</span>
                {mode === o.key && <Check className="w-4 h-4 text-brand-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
