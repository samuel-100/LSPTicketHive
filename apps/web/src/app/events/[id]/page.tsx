"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Clock, Users, Minus, Plus } from "lucide-react";

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
  organization: { name: string; slug: string };
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  const hasSelection = Object.values(quantities).some(q => q > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-brand-600">LSPTicketHive</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl p-8 text-white mb-8">
          <div className="text-sm opacity-75 mb-2">{event.category}</div>
          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(event.startDate).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.venue}, {event.city}
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Description */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl p-6 border">
              <h2 className="text-xl font-semibold mb-4">About this event</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              {event.tags.length > 0 && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {event.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl p-6 border sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Tickets</h2>
              <div className="space-y-4">
                {event.ticketTypes.map((tt) => {
                  const available = tt.quantity - tt.sold;
                  const soldOut = available <= 0;
                  return (
                    <div key={tt.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{tt.name}</span>
                        <span className="font-semibold">{tt.price === 0 ? "Free" : `$${tt.price.toFixed(2)}`}</span>
                      </div>
                      {tt.description && <p className="text-xs text-gray-500 mb-2">{tt.description}</p>}
                      {soldOut ? (
                        <span className="text-red-500 text-sm font-medium">Sold Out</span>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{available} left</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(tt.id, -1, tt.maxPerOrder)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center">{quantities[tt.id] || 0}</span>
                            <button onClick={() => updateQuantity(tt.id, 1, Math.min(tt.maxPerOrder, available))} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100">
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
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-3 text-sm">
                    <span className="text-gray-500">Platform fee (2%)</span>
                    <span>${(getTotal() * 0.02).toFixed(2)}</span>
                  </div>
                  <button className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700">
                    Checkout — ${(getTotal() * 1.02 + 0.30).toFixed(2)}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">Includes processing fee</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
