"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HeroButtons() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      setRole(user.role);
    }
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link href="/events" className="inline-flex items-center justify-center gap-2 bg-brand-500 text-black px-7 py-3.5 rounded-full font-semibold hover:bg-brand-400 transition-all">
        Find Events
        <ArrowRight className="w-4 h-4" />
      </Link>
      {role !== "ATTENDEE" && (
        <Link href={role === "ORGANIZER" ? "/dashboard/create" : "/register?role=organizer"} className="inline-flex items-center justify-center gap-2 border border-white/10 text-white px-7 py-3.5 rounded-full font-semibold hover:bg-white/5 transition-all">
          {role === "ORGANIZER" ? "Create Event" : "Start Selling Tickets"}
        </Link>
      )}
    </div>
  );
}
