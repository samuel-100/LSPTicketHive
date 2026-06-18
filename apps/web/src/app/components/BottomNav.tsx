"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Search, MessageCircle, Ticket, User, Megaphone } from "lucide-react";

// Native-app-style bottom tab bar, mobile only.
export default function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    function sync() {
      const s = localStorage.getItem("user");
      setUser(s ? JSON.parse(s) : null);
    }
    sync();
    window.addEventListener("auth-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("auth-change", sync); window.removeEventListener("storage", sync); };
  }, [pathname]);

  // Hide on auth pages.
  if (["/login", "/register", "/verify", "/forgot-password"].includes(pathname)) return null;

  const isOrg = user?.role === "ORGANIZER";
  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/events", label: "Explore", icon: Search },
    user
      ? (isOrg
        ? { href: "/dashboard", label: "Dashboard", icon: Megaphone }
        : { href: "/promote", label: "Earn", icon: Megaphone })
      : { href: "/events", label: "Explore", icon: Search },
    { href: "/messages", label: "Chats", icon: MessageCircle },
    user ? { href: "/tickets", label: "Tickets", icon: Ticket } : { href: "/login", label: "Sign in", icon: User },
    { href: "/profile", label: "You", icon: User },
  ];
  // Dedupe (logged-out case) and cap at 5.
  const seen = new Set<string>();
  const items = tabs.filter(t => { if (seen.has(t.label)) return false; seen.add(t.label); return true; }).slice(0, 5);

  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-stretch justify-around">
        {items.map(t => {
          const I = t.icon;
          const on = active(t.href);
          return (
            <Link key={t.label} href={t.href} className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5">
              <I className={`w-5 h-5 ${on ? "text-brand-400" : "text-white/45"}`} />
              <span className={`text-[10px] ${on ? "text-brand-400 font-medium" : "text-white/45"}`}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
