"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userParam = searchParams.get("user");
    const tokenParam = searchParams.get("token");
    if (userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new Event("auth-change"));
        if (tokenParam) localStorage.setItem("token", tokenParam);
        router.push(user.role === "ORGANIZER" ? "/dashboard" : "/events");
      } catch {
        router.push("/login?error=callback_failed");
      }
    } else {
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white/40">Signing you in...</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/40">Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
