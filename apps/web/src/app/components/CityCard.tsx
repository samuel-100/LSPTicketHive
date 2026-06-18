"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

// City tile with a graceful gradient fallback if the image fails to load.
export default function CityCard({ city, image }: { city: string; image: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link href={`/events?city=${encodeURIComponent(city)}`} className="group relative h-36 rounded-xl overflow-hidden block">
      {!failed ? (
        <img
          src={image}
          alt={city}
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/40 to-brand-700/20 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-white/30" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4">
        <div className="font-semibold text-white">{city}</div>
      </div>
    </Link>
  );
}
