import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LSPTicketHive — Events & Tickets",
  description: "Discover events, buy tickets, and sell your own. Lower fees, faster payouts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
