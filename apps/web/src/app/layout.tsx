import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import PWA from "./components/PWA";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  title: "LSPTicketHive — Events & Tickets",
  description: "Discover events, buy tickets, and sell your own. Lower fees, faster payouts.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LSPTicketHive",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Apply saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('theme')||'dark';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('light',!d);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <main className="pb-16 md:pb-0" style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top))" }}>{children}</main>
        <BottomNav />
        <PWA />
      </body>
    </html>
  );
}
