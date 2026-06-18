import Link from "next/link";
import { Ticket } from "lucide-react";

export const metadata = { title: "Unsubscribe — LSPTicketHive" };

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><Ticket className="w-5 h-5 text-black" /></div>
          <span className="text-xl font-bold">LSPTicketHive</span>
        </Link>
        <h1 className="text-2xl font-bold mb-3">Email preferences</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          Transactional emails (verification codes, ticket confirmations, refund notices) are required for your
          account and cannot be turned off. To stop <span className="text-white/70">event-promotion</span> emails
          from an organizer you follow, simply unfollow them on their event page, or email{" "}
          <a href="mailto:support@lsptickethive.com" className="text-brand-400">support@lsptickethive.com</a> and
          we&apos;ll remove you.
        </p>
        <Link href="/" className="inline-flex bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 transition-colors">
          Back to LSPTicketHive
        </Link>
      </div>
    </div>
  );
}
