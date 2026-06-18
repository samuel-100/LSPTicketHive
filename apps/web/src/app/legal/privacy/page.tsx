import Link from "next/link";
import { Ticket } from "lucide-react";

export const metadata = { title: "Privacy Policy — LSPTicketHive" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center"><Ticket className="w-4 h-4 text-black" /></div>
          <span className="text-lg font-bold">LSPTicketHive</span>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-8">Last updated: 18 June 2026</p>

        <div className="space-y-6 text-white/60 leading-relaxed text-sm">
          <section>
            <h2 className="text-white font-semibold mb-2">1. What we collect</h2>
            <p>Account details (name, email, optional avatar), tickets you buy, events you create, and basic usage data. If you sign in with Google, we receive your name, email, and profile photo.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">2. How we use it</h2>
            <p>To run the Platform: create your account, issue tickets, send verification codes and ticket confirmations, notify you about events you follow, and let organizers check you in at the door.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">3. Sharing</h2>
            <p>When you buy a ticket, the event organizer can see your name, email, and ticket status (for check-in and support). We use Stripe for payments and Resend/AWS for email. We do not sell your data.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">4. Cookies</h2>
            <p>We use a secure session cookie to keep you logged in. We do not use third-party advertising trackers.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">5. Your rights</h2>
            <p>You may access, correct, or delete your data. Email <a href="mailto:support@lsptickethive.com" className="text-brand-400">support@lsptickethive.com</a> to request deletion of your account.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">6. Security</h2>
            <p>Passwords are hashed (bcrypt), data is transmitted over HTTPS, and access is restricted. No system is perfectly secure, but we take reasonable measures to protect your data.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">7. Contact</h2>
            <p><a href="mailto:support@lsptickethive.com" className="text-brand-400">support@lsptickethive.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
