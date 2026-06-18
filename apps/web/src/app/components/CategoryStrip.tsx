"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Music, Moon, UtensilsCrossed, Cpu, Mic, Drama, Trophy, Briefcase } from "lucide-react";

// Vibrant, high-contrast gradients + matching photo so each tile pops.
const CATEGORIES = [
  { name: "Music", icon: Music, grad: "from-fuchsia-600 to-purple-700", img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=70" },
  { name: "Nightlife", icon: Moon, grad: "from-indigo-600 to-blue-800", img: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&q=70" },
  { name: "Food & Drink", icon: UtensilsCrossed, grad: "from-orange-500 to-red-600", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=70" },
  { name: "Tech", icon: Cpu, grad: "from-cyan-500 to-blue-700", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=70" },
  { name: "Comedy", icon: Mic, grad: "from-amber-500 to-orange-600", img: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&q=70" },
  { name: "Arts", icon: Drama, grad: "from-pink-500 to-rose-600", img: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400&q=70" },
  { name: "Sports", icon: Trophy, grad: "from-green-500 to-emerald-700", img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=70" },
  { name: "Business", icon: Briefcase, grad: "from-slate-500 to-gray-700", img: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?w=400&q=70" },
];

export default function CategoryStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {CATEGORIES.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            whileHover={{ y: -6 }}
          >
            <Link href={`/events?category=${encodeURIComponent(c.name)}`} className="block group relative h-28 rounded-2xl overflow-hidden">
              {/* Photo */}
              <img src={c.img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              {/* Color wash */}
              <div className={`absolute inset-0 bg-gradient-to-br ${c.grad} opacity-70 group-hover:opacity-60 transition-opacity mix-blend-multiply`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="absolute bottom-2 inset-x-0 text-center text-xs font-semibold text-white drop-shadow">{c.name}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
