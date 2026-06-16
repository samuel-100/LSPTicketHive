import Link from "next/link";
import { Calendar, Ticket, TrendingUp, Shield, ArrowRight, Star, Users, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LSPTicketHive</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/events" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Browse Events
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Login
            </Link>
            <Link href="/register" className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-medium text-brand-700">Only 2% platform fee — lowest in industry</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Events that bring<br />
            <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">people together</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            The modern platform for selling and buying event tickets. Built for organizers who want to keep more of their revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events" className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-all hover:scale-105">
              Find Events
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register?role=organizer" className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-full font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all">
              Start Selling Tickets
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>10,000+ events</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why organizers choose us</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Everything you need to run successful events, without the excessive fees.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Ticket className="w-6 h-6" />}
              title="Only 2% Fee"
              description="The lowest platform fee in ticketing. Keep more of your revenue with every sale."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Next-Day Payouts"
              description="Get paid fast. No waiting 5-7 days — your money is yours the next day."
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="5-Minute Setup"
              description="Create your event page in minutes. Beautiful design, no coding required."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Secure & Reliable"
              description="Bank-grade encryption protects every transaction. 99.9% uptime guaranteed."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <StepCard number="01" title="Create your event" description="Add your event details, set ticket types and pricing in minutes." />
            <StepCard number="02" title="Share & sell" description="Share your event page. We handle payments, refunds, and attendee comms." />
            <StepCard number="03" title="Get paid" description="Receive your earnings next day. Track everything from your dashboard." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to sell tickets?</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Join organizers who save thousands in fees every month. No contracts, cancel anytime.
            </p>
            <Link href="/register?role=organizer" className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all hover:scale-105">
              Create Your First Event
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-700 rounded flex items-center justify-center">
                <Ticket className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">LSPTicketHive</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <Link href="/events" className="hover:text-gray-900 transition-colors">Events</Link>
              <Link href="/register" className="hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="/login" className="hover:text-gray-900 transition-colors">Login</Link>
            </div>
            <p className="text-sm text-gray-400">&copy; 2026 LSPTicketHive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300">
      <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mb-5">
        {icon}
      </div>
      <h4 className="font-semibold text-lg text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-brand-100 mb-4">{number}</div>
      <h4 className="font-semibold text-lg text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}
