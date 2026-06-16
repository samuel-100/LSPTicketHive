"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ticket, Plus, Trash2, Upload, Image } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TicketTier {
  name: string;
  price: number;
  quantity: number;
  description: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [coverImage, setCoverImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDesc: "",
    venue: "",
    city: "",
    country: "Ireland",
    startDate: "",
    endDate: "",
    category: "Music",
    totalCapacity: 100,
  });

  const [tickets, setTickets] = useState<TicketTier[]>([
    { name: "General Admission", price: 0, quantity: 50, description: "" },
  ]);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  function addTier() {
    setTickets([...tickets, { name: "", price: 0, quantity: 20, description: "" }]);
  }

  function removeTier(index: number) {
    setTickets(tickets.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof TicketTier, value: string | number) {
    const updated = [...tickets];
    updated[index] = { ...updated[index], [field]: value };
    setTickets(updated);
  }

  async function ensureOrganization() {
    const res = await fetch(`${API_URL}/api/organizations/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.data) return true;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const orgName = `${user.firstName || "My"}'s Events`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

    const createRes = await fetch(`${API_URL}/api/organizations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: orgName, slug: slug + "-" + Date.now() }),
    });
    const createData = await createRes.json();
    return createData.success;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const res = await fetch(`${API_URL}/api/upload/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contentType: file.type, fileExtension: ext }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      await fetch(data.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      setCoverImage(data.data.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const orgReady = await ensureOrganization();
    if (!orgReady) {
      setError("Failed to set up your organizer profile. Please try again.");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      coverImageUrl: coverImage || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      totalCapacity: Number(form.totalCapacity),
      ticketTypes: tickets.map(t => ({
        ...t,
        price: Number(t.price),
        quantity: Number(t.quantity),
        currency: "EUR",
        maxPerOrder: 10,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to create event");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Create Event</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Details */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Event Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Event Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Dublin Jazz Night"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Short Description</label>
                <input
                  type="text"
                  value={form.shortDesc}
                  onChange={e => setForm({ ...form, shortDesc: e.target.value })}
                  placeholder="One line about your event"
                  maxLength={300}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Full Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Tell attendees what to expect..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="Music">Music</option>
                  <option value="Nightlife">Nightlife</option>
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Arts">Arts</option>
                  <option value="Sports">Sports</option>
                  <option value="Tech">Tech</option>
                  <option value="Business">Business</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Community">Community</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </section>

          {/* Cover Image */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Cover Image</h2>
            <div className="relative">
              {coverImage ? (
                <div className="relative rounded-xl overflow-hidden h-48">
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-lg hover:bg-black/80 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-brand-500/30 transition-colors">
                  {uploading ? (
                    <span className="text-white/40 text-sm">Uploading...</span>
                  ) : (
                    <>
                      <Image className="w-8 h-8 text-white/20 mb-2" />
                      <span className="text-white/40 text-sm">Click to upload cover image</span>
                      <span className="text-white/20 text-xs mt-1">JPG, PNG up to 5MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </section>

          {/* Date & Time */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Date & Time</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Start</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">End</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Venue */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Venue</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Venue Name</label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={e => setForm({ ...form, venue: e.target.value })}
                  placeholder="e.g. The Grand Social"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Dublin"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Tickets */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Ticket Tiers</h2>
              <button type="button" onClick={addTier} className="text-brand-400 text-sm font-medium flex items-center gap-1 hover:text-brand-300 transition-colors">
                <Plus className="w-4 h-4" />
                Add Tier
              </button>
            </div>
            <div className="space-y-4">
              {tickets.map((tier, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-brand-400" />
                      <span className="text-sm text-white/40">Tier {i + 1}</span>
                    </div>
                    {tickets.length > 1 && (
                      <button type="button" onClick={() => removeTier(i)} className="text-red-400/60 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Name</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={e => updateTier(i, "name", e.target.value)}
                        required
                        placeholder="VIP"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Price (€)</label>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={e => updateTier(i, "price", e.target.value)}
                        min={0}
                        step={0.01}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={tier.quantity}
                        onChange={e => updateTier(i, "quantity", e.target.value)}
                        min={1}
                        required
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-500 text-black py-4 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {loading ? "Publishing..." : "Publish Event"}
            </button>
            <Link href="/dashboard" className="px-8 py-4 border border-white/10 text-white/60 rounded-xl font-medium hover:border-white/20 transition-colors text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
