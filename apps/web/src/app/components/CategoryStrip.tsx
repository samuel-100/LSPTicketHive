"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Music, Moon, UtensilsCrossed, Cpu, Mic, Palette, Trophy, Briefcase } from "lucide-react";

const CATEGORIES = [
  { name: "Music", icon: Music, color: "from-pink-500/20 to-purple-500/10" },
  { name: "Nightlife", icon: Moon, color: "from-indigo-500/20 to-blue-500/10" },
  { name: "Food & Drink", icon: UtensilsCrossed, color: "from-orange-500/20 to-red-500/10" },
  { name: "Tech", icon: Cpu, color: "from-cyan-500/20 to-blue-500/10" },
  { name: "Comedy", icon: Mic, color: "from-yellow-500/20 to-orange-500/10" },
  { name: "Arts", icon: Palette, color: "from-fuchsia-500/20 to-pink-500/10" },
  { name: "Sports", icon: Trophy, color: "from-green-500/20 to-emerald-500/10" },
  { name: "Business", icon: Briefcase, color: "from-slate-500/20 to-gray-500/10" },
];

export default function CategoryStrip() {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      {CATEGORIES.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileHover={{ y: -4 }}
          >
            <Link href={`/events?category=${encodeURIComponent(c.name)}`} className="block text-center group">
              <div className={`aspect-square rounded-2xl bg-gradient-to-br ${c.color} border border-white/5 flex items-center justify-center mb-2 group-hover:border-brand-500/40 transition-colors`}>
                <Icon className="w-6 h-6 text-white/70 group-hover:text-brand-400 transition-colors" />
              </div>
              <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">{c.name}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
