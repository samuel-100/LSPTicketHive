"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Clock, Users, Minus, Plus, Ticket, ArrowLeft } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  maxPerOrder: number;
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  shortDesc?: string;
  coverImageUrl?: string | null;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  isOnline: boolean;
  onlineUrl?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  category?: string;
  tags: string[];
  totalCapacity: number;
  ticketTypes: TicketType[];
  organizationId: string;
  organization: { id: string; name: string; slug: string };
}

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/events/${params.id}`)
      .then(r => r.json())
      .then(data => { setEvent(data.data); setLoading(false); });
  }, [params.id]);

  function updateQuantity(ticketTypeId: string, delta: number, max: number) {
    setQuantities(prev => {
      const current = prev[ticketTypeId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [ticketTypeId]: next };
    });
  }

  function getTotal() {
    if (!event) return 0;
    return event.ticketTypes.reduce((sum, tt) => sum + (quantities[tt.id] || 0) * tt.price, 0);
  }

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [showTab, setShowTab] = useState<"stats" | "attendees" | "followers">("stats");

  useEffect(() => {
    if (!event) return;
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) return;

    // Check if owner
    fetch(`${API_URL}/api/organizations/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    }).then(r => r.json()).then(d => {
      if (d.data && d.data.id === event.organizationId) {
        setIsOwner(true);
        // Fetch attendees
        fetch(`${API_URL}/api/events/${params.id}/attendees`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }).then(r => r.json()).then(a => {
          if (a.data) {
            setAttendees(a.data.attendees || []);
            setCheckedInCount(a.data.checkedIn || 0);
          }
        }).catch(() => {});
        // Fetch followers
        fetch(`${API_URL}/api/events/${params.id}/followers`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }).then(r => r.json()).then(f => {
          if (f.data) setFollowers(f.data.followers || []);
        }).catch(() => {});
      }
    }).catch(() => {});

    // Check follow status
    fetch(`${API_URL}/api/follow/check/${event.organization.id || ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => { if (d.data) setIsFollowing(d.data.following); }).catch(() => {});
  }, [event]);

  async function toggleFollow() {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    const orgId = (event as any)?.organizationId || (event as any)?.organization?.id;
    if (!orgId) return;
    const method = isFollowing ? "DELETE" : "POST";
    await fetch(`${API_URL}/api/follow/${orgId}`, { method, headers: { Authorization: `Bearer ${token}` } });
    setIsFollowing(!isFollowing);
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId: params.id, items }),
      });
      const data = await res.json();
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else if (data.data?.free) {
        window.location.href = `/orders/${data.data.orderId}?success=true`;
      } else if (data.data?.orderId) {
        window.location.href = `/orders/${data.data.orderId}?success=true`;
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch {
      alert("Network error");
    }
    setCheckoutLoading(false);
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Loading...</div>;
  if (!event) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30">Event not found</div>;

  const hasSelection = Object.values(quantities).some(q => q > 0);
  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/events" className="text-white/40 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <Ticket className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-bold text-white">LSPTicketHive</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Event Hero */}
        <div className="bg-gradient-to-br from-brand-500/20 to-brand-700/5 border border-brand-500/20 rounded-2xl p-8 md:p-12 mb-8 relative overflow-hidden">
          {event.coverImageUrl && (
            <img src={event.coverImageUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="relative z-10">
          <div className="text-brand-400 text-sm font-medium mb-3 uppercase tracking-wider">{event.category}</div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{event.title}</h1>
          {event.shortDesc && <p className="text-white/50 text-lg mb-6">{event.shortDesc}</p>}
          <div className="flex flex-wrap gap-6 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              {new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              {new Date(event.startDate).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })} – {new Date(event.endDate).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {event.venue && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-400" />
                {event.venue}, {event.city}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              {event.totalCapacity} capacity
            </span>
          </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Description */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">About this event</h2>
              <p className="text-white/50 whitespace-pre-wrap leading-relaxed">{event.description}</p>
              {event.tags.length > 0 && (
                <div className="mt-6 flex gap-2 flex-wrap">
                  {event.tags.map(tag => (
                    <span key={tag} className="bg-white/5 text-white/40 px-3 py-1 rounded-full text-sm">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Organizer */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Organized by</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500/10 rounded-full flex items-center justify-center">
                    <span className="text-brand-400 font-semibold">{event.organization.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{event.organization.name}</p>
                  </div>
                </div>
                <button
                  onClick={toggleFollow}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isFollowing
                      ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                      : "bg-white/5 text-white/60 border border-white/10 hover:border-brand-500/30"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          </div>

          {/* Ticket Selection OR Owner Management */}
          <div className="md:col-span-1">
            {isOwner ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 sticky top-20">
                <h2 className="text-lg font-semibold text-white mb-4">Event Management</h2>

                {/* Tabs */}
                <div className="flex gap-1 mb-5 bg-white/5 rounded-lg p-1">
                  <button onClick={() => setShowTab("stats")} className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors ${showTab === "stats" ? "bg-brand-500 text-black" : "text-white/40"}`}>Stats</button>
                  <button onClick={() => setShowTab("attendees")} className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors ${showTab === "attendees" ? "bg-brand-500 text-black" : "text-white/40"}`}>Buyers ({attendees.length})</button>
                  <button onClick={() => setShowTab("followers")} className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors ${showTab === "followers" ? "bg-brand-500 text-black" : "text-white/40"}`}>Followers ({followers.length})</button>
                </div>

                {/* Stats Tab */}
                {showTab === "stats" && (
                  <>
                    <div className="space-y-3 mb-4">
                      {event.ticketTypes.map(tt => {
                        const pct = tt.quantity > 0 ? Math.round((tt.sold / tt.quantity) * 100) : 0;
                        return (
                          <div key={tt.id} className="border border-white/5 rounded-lg p-2.5">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white">{tt.name}</span>
                              <span className="text-white/40">{tt.sold}/{tt.quantity}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                              <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-white/5 pt-3 mb-4 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Tickets sold</span>
                        <span className="text-white font-medium">{event.ticketTypes.reduce((s, t) => s + t.sold, 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Checked in</span>
                        <span className="text-white font-medium">{checkedInCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Revenue</span>
                        <span className="text-brand-400 font-medium">€{event.ticketTypes.reduce((s, t) => s + t.sold * t.price, 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Followers</span>
                        <span className="text-white">{followers.length}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Attendees Tab */}
                {showTab === "attendees" && (
                  <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                    {attendees.length === 0 ? (
                      <p className="text-xs text-white/30 text-center py-4">No tickets sold yet</p>
                    ) : attendees.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                          {a.user.avatarUrl ? (
                            <img src={a.user.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                          ) : (
                            <span className="text-xs text-brand-400 font-bold">{a.user.firstName?.[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white font-medium truncate">{a.user.firstName} {a.user.lastName}</div>
                          <div className="text-[10px] text-white/30 truncate">{a.ticketType} · {a.status === "USED" ? "✓ Checked in" : "Valid"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Followers Tab */}
                {showTab === "followers" && (
                  <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                    {followers.length === 0 ? (
                      <p className="text-xs text-white/30 text-center py-4">No followers yet</p>
                    ) : followers.map((f: any) => (
                      <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                          {f.avatarUrl ? (
                            <img src={f.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                          ) : (
                            <span className="text-xs text-brand-400 font-bold">{f.firstName?.[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white font-medium truncate">{f.firstName} {f.lastName}</div>
                          <div className="text-[10px] text-white/30 truncate">{f.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <Link href="/dashboard/scan" className="w-full flex items-center justify-center gap-2 bg-brand-500 text-black py-3 rounded-xl text-sm font-semibold hover:bg-brand-400 transition-colors">
                    Scan Tickets
                  </Link>
                  <button className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                    Edit Event
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                    Share Link
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 sticky top-20">
              <h2 className="text-xl font-semibold text-white mb-5">Get Tickets</h2>
              <div className="space-y-3">
                {event.ticketTypes.map((tt) => {
                  const available = tt.quantity - tt.sold;
                  const soldOut = available <= 0;
                  return (
                    <div key={tt.id} className="border border-white/5 rounded-xl p-4 hover:border-brand-500/20 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-white">{tt.name}</span>
                        <span className="font-semibold text-brand-400">{tt.price === 0 ? "Free" : `€${tt.price}`}</span>
                      </div>
                      {tt.description && <p className="text-xs text-white/30 mb-2">{tt.description}</p>}
                      {soldOut ? (
                        <span className="text-red-400 text-sm font-medium">Sold Out</span>
                      ) : (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-white/20">{available} left</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(tt.id, -1, tt.maxPerOrder)} className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:border-white/30 hover:text-white transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-white font-medium">{quantities[tt.id] || 0}</span>
                            <button onClick={() => updateQuantity(tt.id, 1, Math.min(tt.maxPerOrder, available))} className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:border-brand-500 hover:text-brand-400 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasSelection && (
                <div className="mt-5 pt-5 border-t border-white/5">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-white/40">{totalTickets} ticket{totalTickets > 1 ? "s" : ""}</span>
                    <span className="text-white">€{getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-sm">
                    <span className="text-white/20">Platform fee (2%)</span>
                    <span className="text-white/40">€{(getTotal() * 0.02).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full bg-brand-500 text-black py-3.5 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors"
                  >
                    {checkoutLoading ? "Processing..." : `Checkout — €${(getTotal() * 1.02).toFixed(2)}`}
                  </button>
                  <p className="text-xs text-white/20 text-center mt-2">Secure payment via Stripe</p>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
