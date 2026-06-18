import Link from "next/link";
import { Ticket } from "lucide-react";

export const metadata = { title: "Terms of Service — LSPTicketHive" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center"><Ticket className="w-4 h-4 text-black" /></div>
          <span className="text-lg font-bold">LSPTicketHive</span>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-8">Last updated: 18 June 2026</p>

        <div className="space-y-6 text-white/60 leading-relaxed text-sm">
          <section>
            <h2 className="text-white font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account or buying a ticket on LSPTicketHive (&quot;the Platform&quot;), you agree to these Terms. If you do not agree, do not use the Platform.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">2. The Platform</h2>
            <p>LSPTicketHive is a marketplace that lets organizers (&quot;Businesses&quot;) sell tickets and lets attendees buy them. We are not the organizer of any event. The Business is solely responsible for its event, its content, and honoring tickets.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">3. Accounts</h2>
            <p>You must provide accurate information and keep your login secure. You are responsible for activity under your account. We may suspend accounts that violate these Terms.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">4. Tickets &amp; Payments</h2>
            <p>Ticket prices are set by the Business. We charge a 2% platform fee. Payments are processed by Stripe; by purchasing you also agree to Stripe&apos;s terms. A ticket is a limited license to attend an event and may be revoked for fraud or breach.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">5. Refunds</h2>
            <p>Refunds are governed by our <Link href="/legal/refund" className="text-brand-400">Refund Policy</Link>. Businesses set refund terms for their events; the Platform facilitates refunds where applicable.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">6. Prohibited Conduct</h2>
            <p>No fraud, resale above face value where prohibited, duplicate/forged tickets, harassment, or unlawful events. We may remove events and tickets that breach these rules.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">7. Liability</h2>
            <p>The Platform is provided &quot;as is.&quot; To the extent permitted by law, LSPTicketHive is not liable for the conduct of Businesses or attendees, or for events that are cancelled, postponed, or not as described.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">8. Contact</h2>
            <p>Questions: <a href="mailto:support@lsptickethive.com" className="text-brand-400">support@lsptickethive.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
