import Link from "next/link";
import { Ticket } from "lucide-react";

export const metadata = { title: "Offline — LSPTicketHive" };

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 text-center">
      <div>
        <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Ticket className="w-7 h-7 text-black" />
        </div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re offline</h1>
        <p className="text-white/40 mb-6 max-w-sm">Check your connection and try again. Your saved tickets are still in your account when you reconnect.</p>
        <Link href="/" className="inline-flex bg-brand-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-400 transition-colors">Retry</Link>
      </div>
    </div>
  );
}
