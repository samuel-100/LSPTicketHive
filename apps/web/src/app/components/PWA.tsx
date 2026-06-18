"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function PWA() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Register the service worker.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // Capture the install prompt (Android/desktop Chrome).
    function onPrompt(e: any) {
      e.preventDefault();
      setDeferred(e);
      if (!localStorage.getItem("pwa-dismissed")) setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  }
  function dismiss() {
    setShow(false);
    localStorage.setItem("pwa-dismissed", "1");
  }

  if (!show) return null;
  return (
    <div className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-4 sm:w-80 z-[90] bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
      <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">Install LSPTicketHive</div>
        <div className="text-xs text-white/40">Add to your home screen for the app experience.</div>
      </div>
      <button onClick={install} className="bg-brand-500 text-black text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-400 transition-colors shrink-0">Install</button>
      <button onClick={dismiss} className="text-white/30 hover:text-white shrink-0"><X className="w-4 h-4" /></button>
    </div>
  );
}
