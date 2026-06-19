"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Mail, MapPin, Save, Ticket, Heart, Users, BadgeCheck, Rocket, ChevronRight, Pencil, Megaphone, MessageCircle, HelpCircle, FileText, Lock, RefreshCw, LogOut } from "lucide-react";
import Link from "next/link";
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
  const [editOpen, setEditOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const emptyAddr = { address: "", address2: "", city: "", country: "Ireland", county: "" };
  const [addresses, setAddresses] = useState<any>({ home: { ...emptyAddr }, billing: { ...emptyAddr }, shipping: { ...emptyAddr }, work: { ...emptyAddr } });
  const [savingAddr, setSavingAddr] = useState(false);
  const [savedAddr, setSavedAddr] = useState(false);

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
          if (data.data.addresses) {
            setAddresses((prev: any) => ({
              home: { ...prev.home, ...(data.data.addresses.home || {}) },
              billing: { ...prev.billing, ...(data.data.addresses.billing || {}) },
              shipping: { ...prev.shipping, ...(data.data.addresses.shipping || {}) },
              work: { ...prev.work, ...(data.data.addresses.work || {}) },
            }));
          }
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

  function setAddr(kind: string, field: string, value: string) {
    setAddresses((p: any) => ({ ...p, [kind]: { ...p[kind], [field]: value } }));
  }
  async function saveAddresses() {
    setSavingAddr(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/auth/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      credentials: "include",
      body: JSON.stringify({ addresses }),
    });
    const data = await res.json();
    if (data.success) { setSavedAddr(true); setTimeout(() => setSavedAddr(false), 3000); }
    setSavingAddr(false);
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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
  }

  if (!user) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>;

  const isBusiness = user.role === "ORGANIZER";
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IE", { month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-5 py-6 pb-20">
        <h1 className="text-3xl font-bold text-white mb-5">Account</h1>

        {/* Profile card */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[#141414] flex items-center justify-center">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-brand-400">{firstName[0]}{lastName[0]}</span>}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-400 transition-colors">
                <Camera className="w-3.5 h-3.5 text-black" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold text-white truncate">{firstName} {lastName}</h2>
                {user.emailVerified && <BadgeCheck className="w-5 h-5 text-brand-400 shrink-0" />}
              </div>
              {city && <p className="text-white/50 text-sm">{city}</p>}
              <p className="text-white/40 text-xs mt-0.5">{isBusiness ? "Business account" : "Attendee"}{joined ? ` · Joined ${joined}` : ""}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <a href="/saved" className="text-white"><b>{user._count?.following ?? 0}</b> <span className="text-white/40">Following</span></a>
                <a href="/tickets" className="text-white"><b>{user._count?.tickets ?? 0}</b> <span className="text-white/40">Tickets</span></a>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade to business (attendees only) */}
        {!isBusiness && (
          <button onClick={upgradeToBusiness} disabled={upgrading} className="w-full bg-gradient-to-r from-brand-500/15 to-transparent border border-brand-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3 text-left hover:from-brand-500/25 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0"><Rocket className="w-5 h-5 text-brand-400" /></div>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm">Start selling tickets</div>
              <div className="text-white/40 text-xs">Upgrade to a Business account</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30" />
          </button>
        )}

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <Group>
          <Row icon={<Pencil className="w-5 h-5" />} label="Edit profile" onClick={() => setEditOpen(o => !o)} />
          {editOpen && (
            <div className="px-4 py-4 border-t border-white/5 space-y-4 bg-white/[0.01]">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name"><input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} /></Field>
                <Field label="Last Name"><input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} /></Field>
              </div>
              <Field label="Email">
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                  <Mail className="w-4 h-4 text-white/30" />
                  <span className="text-white/50 text-sm flex-1 truncate">{user.email}</span>
                  {user.emailVerified && <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">Verified</span>}
                </div>
              </Field>
              <Field label="Phone"><PhoneInput value={phone} onChange={setPhone} /></Field>
              <Field label="City"><CitySearch value={city} onChange={setCity} placeholder="Search your city…" /></Field>
              <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-brand-500 text-black py-3 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" />{saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
          <Row icon={<Heart className="w-5 h-5" />} label="Saved events" href="/saved" />
          <Row icon={<Ticket className="w-5 h-5" />} label="My tickets" href="/tickets" />
          {!isBusiness && <Row icon={<Megaphone className="w-5 h-5" />} label="Promote & Earn" href="/promote" />}
          {isBusiness && <Row icon={<Megaphone className="w-5 h-5" />} label="Dashboard" href="/dashboard" />}
          <Row icon={<MessageCircle className="w-5 h-5" />} label="Messages" href="/messages" last />
        </Group>

        {/* Account settings — addresses (Eventbrite-style) */}
        <SectionLabel>Account settings</SectionLabel>
        <Group>
          <Row icon={<MapPin className="w-5 h-5" />} label="Addresses" onClick={() => setAcctOpen(o => !o)} last />
          {acctOpen && (
            <div className="px-4 py-4 border-t border-white/5 space-y-6 bg-white/[0.01]">
              {([["home", "Home Address"], ["billing", "Billing Address"], ["shipping", "Shipping Address"], ["work", "Work Address"]] as const).map(([kind, title]) => (
                <div key={kind} className="space-y-3">
                  <h4 className="text-white font-bold text-base">{title}</h4>
                  <Field label="Address"><input value={addresses[kind].address} onChange={e => setAddr(kind, "address", e.target.value)} className={inputCls} /></Field>
                  <Field label="Address 2"><input value={addresses[kind].address2} onChange={e => setAddr(kind, "address2", e.target.value)} className={inputCls} /></Field>
                  <Field label="Town/City"><input value={addresses[kind].city} onChange={e => setAddr(kind, "city", e.target.value)} className={inputCls} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Country">
                      <select value={addresses[kind].country} onChange={e => setAddr(kind, "country", e.target.value)} className={inputCls}>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="County">
                      {addresses[kind].country === "Ireland" ? (
                        <select value={addresses[kind].county} onChange={e => setAddr(kind, "county", e.target.value)} className={inputCls}>
                          <option value="">Select a County</option>
                          {IE_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <input value={addresses[kind].county} onChange={e => setAddr(kind, "county", e.target.value)} placeholder="County / State" className={inputCls} />
                      )}
                    </Field>
                  </div>
                </div>
              ))}
              <button onClick={saveAddresses} disabled={savingAddr} className="w-full flex items-center justify-center gap-2 bg-brand-500 text-black py-3 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" />{savedAddr ? "Saved!" : savingAddr ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </Group>

        {/* Help */}
        <SectionLabel>Help</SectionLabel>
        <Group>
          <Row icon={<HelpCircle className="w-5 h-5" />} label="Browse Help Center" href="mailto:support@lsptickethive.com" last />
        </Group>

        {/* Legal */}
        <SectionLabel>Legal</SectionLabel>
        <Group>
          <Row icon={<FileText className="w-5 h-5" />} label="Terms of Service" href="/legal/terms" />
          <Row icon={<Lock className="w-5 h-5" />} label="Privacy" href="/legal/privacy" />
          <Row icon={<RefreshCw className="w-5 h-5" />} label="Refund Policy" href="/legal/refund" last />
        </Group>

        <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 font-medium mt-8 px-1">
          <LogOut className="w-5 h-5" /> Sign out
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors";

const IE_COUNTIES = ["Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal", "Down", "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow"];
const COUNTRIES = ["Ireland", "United Kingdom", "United States", "Canada", "Australia", "Germany", "France", "Spain", "Italy", "Netherlands", "Belgium", "Nigeria", "Ghana", "South Africa", "Kenya", "India", "Other"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-2">{label}</label>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-white mt-7 mb-3">{children}</h3>;
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">{children}</div>;
}

function Row({ icon, label, href, onClick, last }: { icon: React.ReactNode; label: string; href?: string; onClick?: () => void; last?: boolean }) {
  const content = (
    <div className={`flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors ${last ? "" : "border-b border-white/5"}`}>
      <span className="text-brand-400">{icon}</span>
      <span className="flex-1 text-white text-[15px]">{label}</span>
      <ChevronRight className="w-5 h-5 text-white/25" />
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return <button onClick={onClick} className="w-full text-left">{content}</button>;
}
