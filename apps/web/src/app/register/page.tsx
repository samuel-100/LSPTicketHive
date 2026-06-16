"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ticket } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/40">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "organizer" ? "ORGANIZER" : "ATTENDEE";

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: defaultRole });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      if (data.data.user.role === "ORGANIZER") {
        router.push("/dashboard");
      } else {
        router.push("/events");
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold text-white">LSPTicketHive</span>
        </Link>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Create your account</h2>
          <p className="text-white/40 text-center text-sm mb-8">Start discovering or selling event tickets</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  required
                  placeholder="John"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  required
                  placeholder="Doe"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                placeholder="Min 8 characters"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "ATTENDEE" })}
                  className={`p-3.5 border rounded-xl text-sm font-medium transition-all ${
                    form.role === "ATTENDEE"
                      ? "border-brand-500 bg-brand-500/10 text-brand-400"
                      : "border-white/10 text-white/40 hover:border-white/20"
                  }`}
                >
                  Buy Tickets
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "ORGANIZER" })}
                  className={`p-3.5 border rounded-xl text-sm font-medium transition-all ${
                    form.role === "ORGANIZER"
                      ? "border-brand-500 bg-brand-500/10 text-brand-400"
                      : "border-white/10 text-white/40 hover:border-white/20"
                  }`}
                >
                  Sell Tickets
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 text-black py-3.5 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
