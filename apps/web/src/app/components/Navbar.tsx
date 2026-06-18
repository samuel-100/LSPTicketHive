"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ticket, Search, Menu, X, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; label: string }[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);

  // Re-read the logged-in user on mount, on every route change (so it updates
  // right after login/signup navigation), and on auth events from other tabs.
  useEffect(() => {
    function syncUser() {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    }
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("auth-change", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth-change", syncUser);
    };
  }, [pathname]);

  // Worldwide place autocomplete via Photon (OpenStreetMap, no API key needed).
  useEffect(() => {
    const q = location.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    setSearchingCity(true);
    const t = setTimeout(async () => {
      try {
        // No layer filter → matches cities, towns, villages, districts, regions worldwide.
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        if (cancelled) return;
        const seen = new Set<string>();
        const opts = (data.features || [])
          .map((f: any) => {
            const p = f.properties || {};
            // Prefer a place-like name; fall back to whatever name OSM gives.
            const name = p.name || p.city || p.county || p.state || "";
            const parts = [name, p.state && p.state !== name ? p.state : null, p.country].filter(Boolean);
            return { name, label: parts.join(", ") };
          })
          .filter((o: any) => o.name && !seen.has(o.label) && seen.add(o.label));
        setSuggestions(opts);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
      if (!cancelled) setSearchingCity(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [location]);

  function chooseCity(city: string) {
    setLocation(city);
    setSuggestions([]);
    setLocationOpen(false);
    router.push(`/events?city=${encodeURIComponent(city)}`);
  }

  function detectLocation() {
    setDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
            const data = await res.json();
            setLocation(data.city || data.locality || "");
          } catch {
            setLocation("");
          }
          setDetecting(false);
          setLocationOpen(false);
        },
        () => { setDetecting(false); setLocationOpen(false); }
      );
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (location.trim() && location !== "Detecting...") params.set("city", location.trim());
    router.push(`/events?${params.toString()}`);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
  }

  const isActive = (path: string) => pathname === path;

  return (
    <header className="fixed top-0 w-full bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Back / Forward (desktop web only) + Logo */}
        <div className="flex items-center gap-2">
          {/* Browser-style nav arrows: desktop only — mobile uses the bottom tab bar */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.forward()}
              aria-label="Go forward"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-bold text-white">LSPTicketHive</span>
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-lg mx-6">
          <div className="flex items-center w-full bg-[#1a1a1a] border border-white/[0.06] rounded-full">
            <div className="flex items-center gap-2 pl-4 flex-1">
              <Search className="w-4 h-4 text-white/25 shrink-0" />
              <input
                type="text"
                placeholder="Search events"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full py-2.5"
              />
            </div>
            <div className="relative border-l border-white/[0.06]">
              <button
                type="button"
                onClick={() => setLocationOpen(!locationOpen)}
                className="flex items-center gap-1.5 px-3 py-2.5"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="text-sm text-white/50 whitespace-nowrap">{location || "Choose location"}</span>
              </button>
              {locationOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 border-b border-white/5">
                    <input
                      type="text"
                      autoFocus
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && location.trim()) {
                          chooseCity(suggestions[0]?.name || location.trim());
                        }
                      }}
                      placeholder="Search any city or place…"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Live worldwide suggestions while typing */}
                  {location.trim().length >= 2 && (
                    <div className="max-h-64 overflow-y-auto border-b border-white/5">
                      {searchingCity && suggestions.length === 0 && (
                        <div className="px-4 py-3 text-sm text-white/30">Searching…</div>
                      )}
                      {!searchingCity && suggestions.length === 0 && (
                        <div className="px-4 py-3 text-sm text-white/30">No places found</div>
                      )}
                      {suggestions.map((s, i) => (
                        <button
                          key={`${s.label}-${i}`}
                          onClick={() => chooseCity(s.name)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                        >
                          <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                          <span className="text-sm text-white/80 truncate">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Default options when not typing */}
                  {location.trim().length < 2 && (
                    <>
                      <button
                        onClick={detectLocation}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <svg className="w-5 h-5 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/><circle cx="12" cy="12" r="8"/></svg>
                        <span className="text-sm text-white">{detecting ? "Detecting..." : "Use my current location"}</span>
                      </button>
                      <button
                        onClick={() => { setLocation(""); setLocationOpen(false); router.push("/events"); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-t border-white/5"
                      >
                        <svg className="w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4m-4 0h8"/></svg>
                        <span className="text-sm text-white">Browse online events</span>
                      </button>
                      <div className="border-t border-white/5">
                        <div className="px-4 py-2 text-xs text-white/20">Popular cities</div>
                        {["Dublin", "London", "Belfast", "Lagos", "New York", "Berlin", "Paris", "Accra"].map(c => (
                          <button
                            key={c}
                            onClick={() => chooseCity(c)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                          >
                            <svg className="w-4 h-4 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            <span className="text-sm text-white/60">{c}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <button type="submit" className="bg-brand-500 p-2 rounded-full m-1 hover:bg-brand-400 transition-colors">
              <Search className="w-4 h-4 text-black" />
            </button>
          </div>
        </form>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              <NavLink href="/" active={isActive("/")}>Home</NavLink>
              {user.role === "ORGANIZER" && <NavLink href="/dashboard/create" active={isActive("/dashboard/create")}>Create</NavLink>}
              {user.role !== "ORGANIZER" && <NavLink href="/promote" active={isActive("/promote")}>Promote & Earn</NavLink>}
              <NavLink href="/messages" active={isActive("/messages")}>Messages</NavLink>
              <NavLink href="/saved" active={isActive("/saved")}>Saved</NavLink>
              <NavLink href="/tickets" active={isActive("/tickets")}>Tickets</NavLink>
              {user.role === "ORGANIZER" && <NavLink href="/dashboard" active={isActive("/dashboard")}>Dashboard</NavLink>}
              <Link href="/profile" className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 text-xs font-bold hover:bg-brand-500/20 transition-colors ml-2">
                {user.firstName?.[0]}
              </Link>
              <button onClick={handleLogout} className="text-xs text-white/30 hover:text-white transition-colors px-2">
                Log out
              </button>
              <ThemeToggle />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors px-3 py-2">
                Sign in
              </Link>
              <Link href="/register" className="bg-brand-500 text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-400 transition-colors">
                Sign up
              </Link>
              <ThemeToggle />
            </>
          )}
        </div>

        {/* Mobile right controls */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button className="text-white/60 p-1" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0a] px-5 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {/* Mobile search */}
          <form onSubmit={(e) => { handleSearch(e); setMenuOpen(false); }} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-3">
            <Search className="w-4 h-4 text-white/30 shrink-0" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search events" className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full" />
          </form>

          <MobileLink href="/" onClick={() => setMenuOpen(false)}>Home</MobileLink>
          <MobileLink href="/events" onClick={() => setMenuOpen(false)}>Find Events</MobileLink>
          {user && user.role === "ORGANIZER" && <MobileLink href="/dashboard/create" onClick={() => setMenuOpen(false)}>Create Events</MobileLink>}
          {user && user.role === "ORGANIZER" && <MobileLink href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>}
          {user && user.role === "ORGANIZER" && <MobileLink href="/dashboard/find-promoters" onClick={() => setMenuOpen(false)}>Find Promoters</MobileLink>}
          {user && user.role !== "ORGANIZER" && <MobileLink href="/promote" onClick={() => setMenuOpen(false)}>Promote & Earn</MobileLink>}
          {user && <MobileLink href="/messages" onClick={() => setMenuOpen(false)}>Messages</MobileLink>}
          {user && <MobileLink href="/saved" onClick={() => setMenuOpen(false)}>Saved Events</MobileLink>}
          {user && <MobileLink href="/tickets" onClick={() => setMenuOpen(false)}>My Tickets</MobileLink>}
          {user && <MobileLink href="/profile" onClick={() => setMenuOpen(false)}>Profile</MobileLink>}
          {!user && <MobileLink href="/login" onClick={() => setMenuOpen(false)}>Sign in</MobileLink>}
          {!user && <MobileLink href="/register" onClick={() => setMenuOpen(false)}>Sign up</MobileLink>}
          {user && (
            <button onClick={handleLogout} className="block text-sm text-red-400 py-2 w-full text-left">Log out</button>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "text-brand-400 bg-brand-500/10" : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block text-sm text-white/60 hover:text-white py-2">
      {children}
    </Link>
  );
}
