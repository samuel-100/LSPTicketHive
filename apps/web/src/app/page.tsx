import Link from "next/link";
import dynamic from "next/dynamic";
import { Calendar, Ticket, TrendingUp, Shield, ArrowRight, Star, Users, Zap, MapPin } from "lucide-react";

const HeroScene = dynamic(() => import("./components/HeroScene"), { ssr: false });
const EventsGrid = dynamic(() => import("./components/EventsGrid"), { ssr: false });

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Hero - compact */}
      <section className="pt-16 pb-12 px-6 relative overflow-hidden">
        <HeroScene />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-brand-400">Only 2% platform fee — lowest in industry</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
            Events that bring<br />
            <span className="text-brand-400">people together</span>
          </h1>
          <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
            The modern platform for selling and buying event tickets. Built for organizers who want to keep more of their revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/events" className="inline-flex items-center justify-center gap-2 bg-brand-500 text-black px-7 py-3.5 rounded-full font-semibold hover:bg-brand-400 transition-all">
              Find Events
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard/create" className="inline-flex items-center justify-center gap-2 border border-white/10 text-white px-7 py-3.5 rounded-full font-semibold hover:bg-white/5 transition-all">
              Start Selling Tickets
            </Link>
          </div>
        </div>
      </section>

      {/* Events Section - THE MAIN CONTENT */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Popular events near you</h2>
              <p className="text-white/40 text-sm mt-1">Discover what&apos;s happening</p>
            </div>
            <Link href="/events" className="text-brand-400 text-sm font-medium hover:text-brand-300 transition-colors flex items-center gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <EventsGrid />
        </div>
      </section>

      {/* Features - condensed */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Why organizers choose us</h2>
          <div className="grid md:grid-cols-4 gap-5">
            <FeatureCard icon={<Ticket className="w-5 h-5" />} title="Only 2% Fee" description="Lowest in ticketing. Keep more revenue." />
            <FeatureCard icon={<TrendingUp className="w-5 h-5" />} title="Next-Day Payouts" description="Get paid fast. No waiting 5-7 days." />
            <FeatureCard icon={<Calendar className="w-5 h-5" />} title="5-Minute Setup" description="Create your event page in minutes." />
            <FeatureCard icon={<Shield className="w-5 h-5" />} title="Secure & Reliable" description="Bank-grade encryption. 99.9% uptime." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-brand-500/10 to-brand-700/5 border border-brand-500/20 rounded-2xl p-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to sell tickets?</h2>
            <p className="text-white/40 mb-6">Join organizers who save thousands in fees. No contracts, cancel anytime.</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-brand-500 text-black px-7 py-3.5 rounded-full font-semibold hover:bg-brand-400 transition-all">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
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
              <a href="#" className="hover:text-white/60">Terms</a>
              <a href="#" className="hover:text-white/60">Privacy</a>
              <a href="#" className="hover:text-white/60">Cookies</a>
              <a href="#" className="hover:text-white/60">Security</a>
              <span>Ireland 🇮🇪</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
      <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-400 mb-4">
        {icon}
      </div>
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-white/40">{description}</p>
    </div>
  );
}
