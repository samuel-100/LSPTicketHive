import Link from "next/link";
import { Ticket } from "lucide-react";

export const metadata = { title: "Refund Policy — LSPTicketHive" };

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center"><Ticket className="w-4 h-4 text-black" /></div>
          <span className="text-lg font-bold">LSPTicketHive</span>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
        <p className="text-white/40 text-sm mb-8">Last updated: 18 June 2026</p>

        <div className="space-y-6 text-white/60 leading-relaxed text-sm">
          <section>
            <h2 className="text-white font-semibold mb-2">1. Requesting a refund</h2>
            <p>You can request a refund from your order page (My Tickets → open the order → Request Refund) as long as the ticket has <b className="text-white/80">not been checked in</b> at the door. Approved refunds are returned to your original payment method by Stripe, typically within 5–10 business days.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">2. Organizer-set terms</h2>
            <p>Each event organizer may set their own refund window (e.g. &quot;refundable up to 48 hours before&quot;). Where an organizer offers no refunds, all sales are final except as required by law.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">3. Cancelled or postponed events</h2>
            <p>If an organizer cancels an event, you are entitled to a full refund of the ticket price. The 2% platform fee may be non-refundable. For postponed events your ticket remains valid for the new date.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">4. Free tickets</h2>
            <p>Free tickets carry no charge; &quot;refunding&quot; simply cancels the ticket and returns the spot to inventory.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">5. Help</h2>
            <p>If you can&apos;t process a refund yourself, contact the organizer or email <a href="mailto:support@lsptickethive.com" className="text-brand-400">support@lsptickethive.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
