"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Mail, MapPin, Save, Ticket, Heart, Users, BadgeCheck, Rocket } from "lucide-react";
import PhoneInput from "../components/PhoneInput";
import CitySearch from "../components/CitySearch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setUser(data.data);
          setFirstName(data.data.firstName || "");
          setLastName(data.data.lastName || "");
          setPhone(data.data.phone || "");
          setAvatarUrl(data.data.avatarUrl || "");
          setCity(localStorage.getItem("profile_city") || "");
        }
      });
  }, [router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const token = localStorage.getItem("token");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const res = await fetch(`${API_URL}/api/upload/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ contentType: file.type, fileExtension: ext }),
      });
      const data = await res.json();
      if (data.success) {
        await fetch(data.data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        setAvatarUrl(data.data.publicUrl);
      }
    } catch {}
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/auth/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      credentials: "include",
      body: JSON.stringify({ firstName, lastName, avatarUrl, phone }),
    });
    const data = await res.json();
    if (data.success) {
      const merged = { ...JSON.parse(localStorage.getItem("user") || "{}"), ...data.data };
      localStorage.setItem("user", JSON.stringify(merged));
      localStorage.setItem("profile_city", city);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function upgradeToBusiness() {
    if (!confirm("Upgrade to a Business account? You'll be able to create and sell events.")) return;
    setUpgrading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/auth/upgrade-to-business`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/dashboard");
    }
    setUpgrading(false);
  }

  if (!user) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>;

  const isBusiness = user.role === "ORGANIZER";
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IE", { month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Cover */}
      <div className="h-48 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-transparent mix-blend-overlay" />
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-16 relative z-10 pb-16">
        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-[#141414] border-4 border-[#0a0a0a] flex items-center justify-center shadow-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-brand-400">{firstName[0]}{lastName[0]}</span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-brand-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-400 transition-colors shadow-lg">
              <Camera className="w-4 h-4 text-black" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-white">{firstName} {lastName}</h1>
              {user.emailVerified && <BadgeCheck className="w-5 h-5 text-brand-400" />}
            </div>
            <p className="text-white/40 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isBusiness ? "bg-brand-500/15 text-brand-400" : "bg-white/10 text-white/60"}`}>
                {isBusiness ? "Business Account" : "Attendee"}
              </span>
              {joined && <span className="text-xs text-white/30">Joined {joined}</span>}
            </div>
          </div>
          {uploading && <span className="text-xs text-brand-400">Uploading…</span>}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Stat icon={<Ticket className="w-4 h-4" />} label="Tickets" value={user._count?.tickets ?? 0} />
          <Stat icon={<Heart className="w-4 h-4" />} label="Following" value={user._count?.following ?? 0} />
          <Stat icon={<Users className="w-4 h-4" />} label="Orders" value={user._count?.orders ?? 0} />
        </div>

        {/* Your city — discover locally */}
        {city.trim() && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span className="text-white font-medium">Happening in {city}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={`/events?city=${encodeURIComponent(city)}`} className="flex-1 min-w-[140px] bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3 hover:bg-brand-500/15 transition-colors">
                <div className="text-sm font-semibold text-brand-400">Events near you →</div>
                <div className="text-xs text-white/40">Browse what&apos;s on in {city}</div>
              </a>
              <a href={`/promoters?city=${encodeURIComponent(city)}`} className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors">
                <div className="text-sm font-semibold text-white">Promoters in {city} →</div>
                <div className="text-xs text-white/40">Organizers putting on events here</div>
              </a>
            </div>
          </motion.div>
        )}

        {/* Upgrade to business (attendees only) */}
        {!isBusiness && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-r from-brand-500/15 to-transparent border border-brand-500/20 rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
              <Rocket className="w-6 h-6 text-brand-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">Start selling tickets</h3>
              <p className="text-white/40 text-sm">Upgrade to a Business account to create and manage events.</p>
            </div>
            <button onClick={upgradeToBusiness} disabled={upgrading} className="bg-brand-500 text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors shrink-0">
              {upgrading ? "…" : "Upgrade"}
            </button>
          </motion.div>
        )}

        {/* Edit form */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white mb-5">Edit details</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name"><input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} /></Field>
              <Field label="Last Name"><input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} /></Field>
            </div>
            <Field label="Email">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                <Mail className="w-4 h-4 text-white/30" />
                <span className="text-white/50 text-sm flex-1">{user.email}</span>
                {user.emailVerified && <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">Verified</span>}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
                <PhoneInput value={phone} onChange={setPhone} />
              </Field>
              <Field label="City">
                <CitySearch value={city} onChange={setCity} placeholder="Search your city…" />
              </Field>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-brand-500 text-black py-3.5 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />
              {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-2">{label}</label>
      {children}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
      <div className="text-brand-400 flex justify-center mb-1.5">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/30">{label}</div>
    </div>
  );
}
