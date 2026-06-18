import Link from "next/link";
import dynamic from "next/dynamic";
import { Calendar, Ticket, TrendingUp, Shield, ArrowRight, Star, Users, Zap, MapPin } from "lucide-react";
import HeroButtons from "./components/HeroButtons";

const HeroScene = dynamic(() => import("./components/HeroScene"), { ssr: false });
const EventsGrid = dynamic(() => import("./components/EventsGrid"), { ssr: false });
const CategoryStrip = dynamic(() => import("./components/CategoryStrip"), { ssr: false });
import CityCard from "./components/CityCard";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Hero - compact */}
      <section className="pt-16 pb-12 px-6 relative overflow-hidden">
        <HeroScene />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
            Events that bring<br />
            <span className="text-brand-400">people together</span>
          </h1>
          <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
            The modern platform for selling and buying event tickets. Built for organizers who want to keep more of their revenue.
          </p>
          <HeroButtons />
        </div>
      </section>

      {/* Browse by category */}
      <section className="py-10 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Browse by category</h2>
          <CategoryStrip />
        </div>
      </section>

      {/* Trending */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">🔥 Trending now</h2>
              <p className="text-white/40 text-sm mt-1">The hottest events selling fast</p>
            </div>
            <Link href="/events?sort=popular" className="text-brand-400 text-sm font-medium hover:text-brand-300 transition-colors flex items-center gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <EventsGrid endpoint="/api/events/meta/trending" />
        </div>
      </section>

      {/* Upcoming / main */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Upcoming events</h2>
              <p className="text-white/40 text-sm mt-1">Discover what&apos;s happening</p>
            </div>
            <Link href="/events" className="text-brand-400 text-sm font-medium hover:text-brand-300 transition-colors flex items-center gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <EventsGrid endpoint="/api/events?limit=6" />
        </div>
      </section>

      {/* Browse by City */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Explore events by city</h2>
          <p className="text-white/40 text-sm mb-8">Find what&apos;s happening near you or around the world</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <CityCard city="Dublin" image="https://images.unsplash.com/photo-1549918864-48ac978761a4?w=400&q=80" />
            <CityCard city="London" image="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80" />
            <CityCard city="Lagos" image="https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=400&q=80" />
            <CityCard city="New York" image="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80" />
            <CityCard city="Paris" image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80" />
            <CityCard city="Berlin" image="https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&q=80" />
            <CityCard city="Accra" image="https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=400&q=80" />
            <CityCard city="Barcelona" image="https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80" />
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-white/5 pt-12 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Use LSPTicketHive</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><Link href="/dashboard/create" className="hover:text-white transition-colors">Create Events</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Find Events</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/tickets" className="hover:text-white transition-colors">Find My Tickets</Link></li>
                <li><Link href="/dashboard/scan" className="hover:text-white transition-colors">Check-In App</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Plan Events</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><Link href="/dashboard/create" className="hover:text-white transition-colors">Sell Tickets Online</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Event Payment System</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Event Management</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">QR Codes for Events</Link></li>
                <li><Link href="/dashboard/create" className="hover:text-white transition-colors">Post Your Event</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Find Events</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><Link href="/events" className="hover:text-white transition-colors">Dublin Events</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Cork Events</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Belfast Events</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Galway Events</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Limerick Events</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Connect With Us</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">TikTok</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter / X</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="mailto:support@lsptickethive.com" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">
                <Ticket className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="text-sm font-semibold text-white">LSPTicketHive</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-white/30">
              <span>&copy; 2026 LSPTicketHive</span>
              <Link href="/legal/terms" className="hover:text-white/60">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-white/60">Privacy</Link>
              <Link href="/legal/refund" className="hover:text-white/60">Refunds</Link>
              <span>Ireland 🇮🇪</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

