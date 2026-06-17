"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Image, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDesc: "",
    venue: "",
    city: "",
    country: "",
    category: "",
    startDate: "",
    endDate: "",
    totalCapacity: 100,
  });

  useEffect(() => {
    fetch(`${API_URL}/api/events/${params.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          const e = data.data;
          setCoverImage(e.coverImageUrl || "");
          setForm({
            title: e.title || "",
            description: e.description || "",
            shortDesc: e.shortDesc || "",
            venue: e.venue || "",
            city: e.city || "",
            country: e.country || "",
            category: e.category || "",
            startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 16) : "",
            endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 16) : "",
            totalCapacity: e.totalCapacity || 100,
          });
        }
        setLoading(false);
      });
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/events/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          coverImageUrl: coverImage || undefined,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          totalCapacity: Number(form.totalCapacity),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push(`/events/${params.id}`), 1500);
      } else {
        setError(data.error || "Failed to update");
      }
    } catch {
      setError("Network error");
    }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/events/${params.id}`} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-white">Edit Event</h1>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">{error}</div>}
        {success && <div className="bg-brand-500/10 border border-brand-500/20 text-brand-400 p-4 rounded-xl mb-6 text-sm">Event updated! Redirecting...</div>}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Cover Image</label>
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden h-44">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setCoverImage("")} className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-lg hover:bg-black/80 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-brand-500/30 transition-colors">
                {uploading ? (
                  <span className="text-white/40 text-sm">Uploading...</span>
                ) : (
                  <>
                    <Image className="w-7 h-7 text-white/20 mb-2" />
                    <span className="text-white/40 text-sm">Click to upload new image</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  const token = localStorage.getItem("token");
                  const ext = file.name.split(".").pop() || "jpg";
                  const res = await fetch(`${API_URL}/api/upload/presign`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, credentials: "include", body: JSON.stringify({ contentType: file.type, fileExtension: ext }) });
                  const data = await res.json();
                  if (data.success) { await fetch(data.data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file }); setCoverImage(data.data.publicUrl); }
                  setUploading(false);
                }} />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Event Title</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Short Description</label>
            <input type="text" value={form.shortDesc} onChange={e => setForm({ ...form, shortDesc: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Full Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors">
              <option value="Music">Music</option>
              <option value="Nightlife">Nightlife</option>
              <option value="Food & Drink">Food & Drink</option>
              <option value="Tech">Tech</option>
              <option value="Comedy">Comedy</option>
              <option value="Arts">Arts</option>
              <option value="Sports">Sports</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Start</label>
              <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">End</label>
              <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Venue</label>
              <input type="text" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">City</label>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-brand-500 text-black py-3.5 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link href={`/events/${params.id}`} className="px-8 py-3.5 border border-white/10 text-white/60 rounded-xl font-medium hover:border-white/20 transition-colors text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
