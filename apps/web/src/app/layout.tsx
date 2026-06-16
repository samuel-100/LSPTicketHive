import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "LSPTicketHive — Events & Tickets",
  description: "Discover events, buy tickets, and sell your own. Lower fees, faster payouts.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
