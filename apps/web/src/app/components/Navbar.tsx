"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ticket, Search, Menu, X, MapPin } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Dublin");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/events?search=${searchQuery}&city=${location}`);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  }

  const isActive = (path: string) => pathname === path;

  return (
    <header className="fixed top-0 w-full bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg font-bold text-white hidden sm:block">LSPTicketHive</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xl mx-6">
          <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-full overflow-hidden">
            <div className="flex items-center gap-2 pl-4 pr-2 flex-1">
              <Search className="w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search events"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder:text-white/30 outline-none w-full py-2.5"
              />
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2 px-3">
              <MapPin className="w-4 h-4 text-brand-400" />
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="bg-transparent text-sm text-white/60 outline-none appearance-none cursor-pointer pr-2"
              >
                <option value="Dublin">Dublin</option>
                <option value="London">London</option>
                <option value="Belfast">Belfast</option>
                <option value="Lagos">Lagos</option>
                <option value="New York">New York</option>
                <option value="Paris">Paris</option>
                <option value="Berlin">Berlin</option>
                <option value="Accra">Accra</option>
                <option value="">All Cities</option>
              </select>
            </div>
            <button type="submit" className="bg-brand-500 text-black p-2.5 rounded-full m-1 hover:bg-brand-400 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              <NavLink href="/dashboard/create" active={isActive("/dashboard/create")}>Create</NavLink>
              <NavLink href="/tickets" active={isActive("/tickets")}>Tickets</NavLink>
              <NavLink href="/dashboard" active={isActive("/dashboard")}>Dashboard</NavLink>
              <span className="text-sm text-white/40 px-2">{user.firstName}</span>
              <button onClick={handleLogout} className="text-xs text-white/30 hover:text-white transition-colors px-2">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors px-3 py-2">
                Sign in
              </Link>
              <Link href="/register" className="bg-brand-500 text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-400 transition-colors">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white/60" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0a] px-6 py-4 space-y-3">
          <MobileLink href="/events" onClick={() => setMenuOpen(false)}>Find Events</MobileLink>
          {user && <MobileLink href="/dashboard/create" onClick={() => setMenuOpen(false)}>Create Events</MobileLink>}
          {user && <MobileLink href="/tickets" onClick={() => setMenuOpen(false)}>My Tickets</MobileLink>}
          {user && <MobileLink href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>}
          {!user && <MobileLink href="/login" onClick={() => setMenuOpen(false)}>Sign in</MobileLink>}
          {!user && <MobileLink href="/register" onClick={() => setMenuOpen(false)}>Sign up</MobileLink>}
          {user && (
            <button onClick={handleLogout} className="block text-sm text-red-400 py-2">Log out</button>
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
