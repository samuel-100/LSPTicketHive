"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ticket } from "lucide-react";
import { TOP_CATEGORIES } from "../lib/categories";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.51-3.23 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
}

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

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: defaultRole, isPromoter: false, promoterInterests: [] as string[] });
  const INTERESTS = TOP_CATEGORIES;
  function toggleInterest(i: string) {
    setForm(f => ({ ...f, promoterInterests: f.promoterInterests.includes(i) ? f.promoterInterests.filter(x => x !== i) : [...f.promoterInterests, i] }));
  }
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
        const msg = data.error?.includes("already") ? "This email is already registered. Try logging in instead." : (data.error || "Registration failed");
        setError(msg);
        setLoading(false);
        return;
      }

      if (data.data.requiresVerification) {
        router.push(`/verify?email=${encodeURIComponent(form.email)}`);
        return;
      }

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      window.dispatchEvent(new Event("auth-change"));

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

          {/* Account type — chosen first so it carries into social signup too */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/60 mb-2">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "ATTENDEE" })}
                className={`p-3 border rounded-xl text-left transition-all ${
                  form.role === "ATTENDEE" ? "border-brand-500 bg-brand-500/10" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className={`text-sm font-semibold mb-0.5 ${form.role === "ATTENDEE" ? "text-brand-400" : "text-white/60"}`}>Attend events</div>
                <div className="text-xs text-white/30">Find & buy tickets</div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "ORGANIZER" })}
                className={`p-3 border rounded-xl text-left transition-all ${
                  form.role === "ORGANIZER" ? "border-brand-500 bg-brand-500/10" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className={`text-sm font-semibold mb-0.5 ${form.role === "ORGANIZER" ? "text-brand-400" : "text-white/60"}`}>Sell tickets</div>
                <div className="text-xs text-white/30">Create events (Business)</div>
              </button>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <button type="button" onClick={() => window.location.href = `${API_URL}/api/auth/google?role=${form.role === "ORGANIZER" ? "organizer" : "attendee"}`} className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3.5 rounded-xl text-white font-medium hover:bg-white/10 transition-colors">
              <GoogleIcon />
              Continue with Google
            </button>
            <button type="button" className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3.5 rounded-xl text-white/40 font-medium cursor-not-allowed">
              <AppleIcon />
              Continue with Apple
              <span className="text-xs text-white/20 ml-1">Soon</span>
            </button>
            <button type="button" className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3.5 rounded-xl text-white/40 font-medium cursor-not-allowed">
              <FacebookIcon />
              Continue with Facebook
              <span className="text-xs text-white/20 ml-1">Soon</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-white/30 text-xs">or sign up with email</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

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

            {/* Promoter opt-in — attendees only */}
            {form.role === "ATTENDEE" && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-white">I also want to promote events & earn 💸</div>
                    <div className="text-xs text-white/40">Share events and earn commission on tickets you sell.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isPromoter: !form.isPromoter })}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${form.isPromoter ? "bg-brand-500" : "bg-white/10"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.isPromoter ? "left-6" : "left-0.5"}`} />
                  </button>
                </label>
                {form.isPromoter && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-xs text-white/50 mb-2">What do you like to promote?</div>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map(i => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleInterest(i)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.promoterInterests.includes(i) ? "bg-brand-500 text-black border-brand-500 font-medium" : "bg-white/5 text-white/60 border-white/10 hover:border-white/30"}`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
