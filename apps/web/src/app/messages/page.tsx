"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <MessagesInner />
    </Suspense>
  );
}

function MessagesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [meId, setMeId] = useState("");
  const [convos, setConvos] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(searchParams.get("c"));
  const [thread, setThread] = useState<any>(null);
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    if (u) setMeId(JSON.parse(u).id);
    loadInbox(t);
  }, [router]);

  useEffect(() => {
    if (active && token) loadThread(active, token);
  }, [active, token]);

  // Ask for notification permission once.
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Light polling so messages feel live + desktop notification on new incoming.
  const lastSeenRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!active || !token) return;
    const i = setInterval(() => loadThread(active, token, true), 5000);
    return () => clearInterval(i);
  }, [active, token]);

  // Poll the inbox for new incoming messages across all conversations → notify.
  useEffect(() => {
    if (!token) return;
    const i = setInterval(async () => {
      const d = await fetch(`${API_URL}/api/messages`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      const list = d.data || [];
      setConvos(list);
      const totalUnread = list.reduce((s: number, c: any) => s + (c.unread || 0), 0);
      document.title = totalUnread > 0 ? `(${totalUnread}) Messages · LSPTicketHive` : "Messages · LSPTicketHive";
      for (const c of list) {
        const last = c.lastMessage;
        if (last && last.senderId !== meId && c.unread > 0) {
          const prev = lastSeenRef.current[c.id];
          if (prev && prev !== last.id && c.id !== active && "Notification" in window && Notification.permission === "granted") {
            new Notification(`${c.other?.firstName || "New message"}`, { body: last.body, icon: "/favicon.ico" });
          }
          lastSeenRef.current[c.id] = last.id;
        }
      }
    }, 8000);
    return () => clearInterval(i);
  }, [token, meId, active]);

  async function loadInbox(t: string) {
    const d = await fetch(`${API_URL}/api/messages`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json());
    setConvos(d.data || []);
  }
  async function loadThread(id: string, t: string, silent = false) {
    const d = await fetch(`${API_URL}/api/messages/${id}`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json());
    if (d.success) {
      setThread(d.data);
      if (!silent) setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    }
  }
  async function send() {
    if (!body.trim() || !active) return;
    const text = body.trim();
    setBody("");
    await fetch(`${API_URL}/api/messages/${active}/send`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: text }),
    });
    loadThread(active, token);
    loadInbox(token);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-white mb-5 flex items-center gap-2"><MessageCircle className="w-6 h-6 text-brand-400" /> Messages</h1>
        <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
          {/* Inbox */}
          <div className={`md:col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-y-auto ${active ? "hidden md:block" : ""}`}>
            {convos.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-sm">No conversations yet</div>
            ) : convos.map(c => (
              <button key={c.id} onClick={() => setActive(c.id)} className={`w-full flex items-center gap-3 p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${active === c.id ? "bg-white/5" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  {c.other?.avatarUrl ? <img src={c.other.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : <span className="text-brand-400 font-bold text-sm">{c.other?.firstName?.[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">{c.other?.firstName} {c.other?.lastName?.[0]}.</span>
                    {c.unread > 0 && <span className="bg-brand-500 text-black text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center">{c.unread}</span>}
                  </div>
                  <p className="text-xs text-white/40 truncate">{c.lastMessage?.body || "New conversation"}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Thread */}
          <div className={`md:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col ${!active ? "hidden md:flex" : ""}`}>
            {!active || !thread ? (
              <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Select a conversation</div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-white/5">
                  <button onClick={() => setActive(null)} className="md:hidden text-white/40"><ArrowLeft className="w-5 h-5" /></button>
                  <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center">
                    {thread.other?.avatarUrl ? <img src={thread.other.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : <span className="text-brand-400 font-bold text-sm">{thread.other?.firstName?.[0]}</span>}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{thread.other?.firstName} {thread.other?.lastName}</div>
                    <div className="text-[10px] text-white/30 uppercase">{thread.other?.role === "ORGANIZER" ? "Business" : (thread.other?.role || "")}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1.5" style={{ backgroundImage: "radial-gradient(circle at 25% 15%, rgba(34,197,94,0.04), transparent 40%)" }}>
                  {thread.messages.map((m: any) => {
                    const mine = m.senderId === meId;
                    const time = new Date(m.createdAt).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm ${mine ? "bg-brand-500 text-black rounded-br-md" : "bg-[#262626] text-white rounded-bl-md"}`}>
                          <span className="whitespace-pre-wrap break-words">{m.body}</span>
                          <span className={`inline-flex items-center gap-0.5 ml-2 align-bottom text-[10px] ${mine ? "text-black/50" : "text-white/30"}`}>
                            {time}
                            {mine && <span>{m.readAt ? "✓✓" : "✓"}</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="p-3 border-t border-white/5 flex gap-2">
                  <input value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message…" className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500" />
                  <button onClick={send} className="bg-brand-500 text-black w-11 h-11 rounded-xl flex items-center justify-center hover:bg-brand-400 transition-colors"><Send className="w-4 h-4" /></button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
