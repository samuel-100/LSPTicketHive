"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, Mail, Save } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setUser(data.data);
          setFirstName(data.data.firstName || "");
          setLastName(data.data.lastName || "");
          setAvatarUrl(data.data.avatarUrl || "");
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
    // For now just update localStorage - API endpoint for profile update can be added
    const updatedUser = { ...user, firstName, lastName, avatarUrl };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  if (!user) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">My Profile</h1>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-500/10 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-brand-400">{firstName[0]}{lastName[0]}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-400 transition-colors">
                <Camera className="w-4 h-4 text-black" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{firstName} {lastName}</h2>
              <p className="text-sm text-white/40">{user.email}</p>
              {uploading && <p className="text-xs text-brand-400 mt-1">Uploading...</p>}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                <Mail className="w-4 h-4 text-white/30" />
                <span className="text-white/50 text-sm">{user.email}</span>
                {user.emailVerified && <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full ml-auto">Verified</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">City</label>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-brand-400 absolute ml-4" />
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Enter your city"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 text-black py-3.5 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
