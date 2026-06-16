"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, Search, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ firstName: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

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

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/events" active={isActive("/events")}>Find Events</NavLink>
          {user && <NavLink href="/dashboard/create" active={isActive("/dashboard/create")}>Create Events</NavLink>}
          {user && <NavLink href="/tickets" active={isActive("/tickets")}>My Tickets</NavLink>}
          {user && <NavLink href="/dashboard" active={isActive("/dashboard")}>Dashboard</NavLink>}
        </nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/40">{user.firstName}</span>
              <button onClick={handleLogout} className="text-sm text-white/40 hover:text-white transition-colors">
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors px-3 py-2">
                Sign in
              </Link>
              <Link href="/register" className="bg-brand-500 text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-400 transition-colors">
                Sign up
              </Link>
            </div>
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
