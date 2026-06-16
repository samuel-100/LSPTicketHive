import Link from "next/link";
import { Calendar, Ticket, TrendingUp, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-600">LSPTicketHive</h1>
          <nav className="flex gap-4">
            <Link href="/events" className="text-gray-600 hover:text-brand-600">
              Browse Events
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-brand-600">
              Login
            </Link>
            <Link href="/register" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-700 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">Events Made Simple</h2>
          <p className="text-xl mb-8 opacity-90">
            Buy tickets to amazing events or sell your own. Only 2% platform fee — the lowest in the industry.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/events" className="bg-white text-brand-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Find Events
            </Link>
            <Link href="/register?role=organizer" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10">
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why LSPTicketHive?</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Ticket className="w-8 h-8 text-brand-600" />}
              title="Only 2% Fee"
              description="The lowest platform fee in ticketing. Keep more of your revenue."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-brand-600" />}
              title="Next-Day Payouts"
              description="Get paid fast. No waiting 5-7 days for your money."
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8 text-brand-600" />}
              title="Easy Setup"
              description="Create your event in minutes. No technical skills needed."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-brand-600" />}
              title="Secure & Reliable"
              description="Bank-grade security. Your data and transactions are protected."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-gray-300 mb-8">Join thousands of organizers already saving money on ticket fees.</p>
          <Link href="/register?role=organizer" className="bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-700">
            Create Your First Event
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>&copy; 2026 LSPTicketHive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-6">
      <div className="flex justify-center mb-4">{icon}</div>
      <h4 className="font-semibold text-lg mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
