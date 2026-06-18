"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setInfo("If that email is registered, we sent a reset code. Check your inbox.");
        setStep("reset");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        router.push(data.data.user.role === "ORGANIZER" ? "/dashboard" : "/events");
      } else {
        setError(data.error || "Reset failed");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold text-white">LSPTicketHive</span>
        </Link>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {step === "request" ? "Reset your password" : "Enter reset code"}
          </h2>
          <p className="text-white/40 text-center text-sm mb-8">
            {step === "request"
              ? "We'll email you a code to reset your password"
              : "Check your email for the 6-digit code, then set a new password"}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm">{error}</div>
          )}
          {info && (
            <div className="bg-brand-500/10 border border-brand-500/20 text-brand-400 p-3 rounded-xl mb-6 text-sm">{info}</div>
          )}

          {step === "request" ? (
            <form onSubmit={requestCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 text-black py-3.5 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending..." : "Send reset code"}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Reset code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  placeholder="6-digit code"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 text-black py-3.5 rounded-xl font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors"
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("request"); setError(""); }}
                className="w-full text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                Didn't get a code? Try again
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Remembered it?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
