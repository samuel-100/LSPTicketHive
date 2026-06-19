"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, MessageCircle, Smile, Users, X, Phone, Video, Camera, Image as ImageIcon, Mic, Trash2, Play, Pause } from "lucide-react";
import { useCall } from "../components/CallProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const EMOJIS = ["😀","😂","🥰","😎","😍","🤝","🙌","👏","🔥","🎉","🎟️","💸","💰","✅","👍","👎","❤️","🙏","💯","⭐","🎵","🕺","💃","🍻","📍","📅","⏰","😅","😢","😡","🤔","👀"];

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
  const { startCall } = useCall();
  const [token, setToken] = useState("");
  const [meId, setMeId] = useState("");
  const [convos, setConvos] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(searchParams.get("c"));
  const [thread, setThread] = useState<any>(null);
  const [body, setBody] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPicks, setGroupPicks] = useState<string[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [meIsAdmin, setMeIsAdmin] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Track the visual viewport so the chat pins to the keyboard on mobile.
  // iOS Safari does NOT shrink 100dvh when the keyboard opens, so we measure
  // window.visualViewport.height directly and apply it as the chat height.
  // Pin the chat to the EXACT visual-viewport rectangle (Instagram-style).
  // On iOS a position:fixed element is anchored to the LAYOUT viewport, so when
  // the keyboard opens it doesn't follow the shrunken visible area. We instead
  // set the chat's top/left/width/height to window.visualViewport's rect, so it
  // always exactly fills what the user can see — composer flush on the keyboard,
  // no gap, no jump.
  const [vvRect, setVvRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onMq = () => setIsMobile(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    const vv = window.visualViewport;
    let raf = 0;
    const apply = () => {
      if (!vv) return;
      // Coalesce bursts of events into one update per frame (kills the shake).
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setVvRect({ top: vv.offsetTop, left: vv.offsetLeft, width: vv.width, height: vv.height });
      });
    };
    if (vv) {
      apply();
      vv.addEventListener("resize", apply);
      vv.addEventListener("scroll", apply);
    }
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", onMq);
      if (vv) { vv.removeEventListener("resize", apply); vv.removeEventListener("scroll", apply); }
    };
  }, []);
  // While a chat is open on mobile: lock background scroll AND hide the global
  // bottom tab bar (via a body class) so the chat is truly full-screen.
  useEffect(() => {
    if (active && isMobile) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("chat-open");
      return () => { document.body.style.overflow = ""; document.body.classList.remove("chat-open"); };
    }
  }, [active, isMobile]);

  // Make the phone's back gesture / browser back close the chat (return to the
  // inbox) instead of leaving the Messages page. We push a history entry when a
  // chat opens and listen for popstate to close it.
  useEffect(() => {
    function onPop() { setActive(null); setThread(null); }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  async function openMembers() {
    if (!active) return;
    const d = await fetch(`${API_URL}/api/messages/${active}/members`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    if (d.success) { setMembers(d.data.members); setMeIsAdmin(d.data.meIsAdmin); setMembersOpen(true); }
  }
  async function addMember(userId: string) {
    await fetch(`${API_URL}/api/messages/${active}/members`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId }) });
    openMembers();
  }
  async function removeMember(userId: string) {
    await fetch(`${API_URL}/api/messages/${active}/members/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    openMembers();
  }
  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    await fetch(`${API_URL}/api/messages/${active}/members/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ isAdmin: makeAdmin }) });
    openMembers();
  }

  // Candidate members = distinct people from my existing 1-1 conversations.
  const contacts = convos.filter(c => !c.isGroup && c.other?.id).map(c => c.other);

  function openNewGroup() {
    setGroupName(""); setGroupPicks([]); setGroupOpen(true);
  }
  function togglePick(id: string) {
    setGroupPicks(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  async function createGroup() {
    if (!groupName.trim() || groupPicks.length === 0) return;
    const res = await fetch(`${API_URL}/api/messages/groups`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: groupName.trim(), memberIds: groupPicks }),
    });
    const d = await res.json();
    if (d.success) { setGroupOpen(false); await loadInbox(token); openConvo(d.data.conversationId); }
  }

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
      // Only re-render the inbox if it actually changed (avoids flicker).
      setConvos((prev) => {
        const sig = (arr: any[]) => arr.map((c) => `${c.id}:${c.lastMessage?.id || ""}:${c.unread}`).join("|");
        return sig(prev) === sig(list) ? prev : list;
      });
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
    try {
      const d = await fetch(`${API_URL}/api/messages/${id}`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json());
      if (d.success) {
        // On polls (silent), only update + scroll if something actually changed —
        // avoids constant re-renders and scroll jumps.
        setThread((prev: any) => {
          const prevMsgs = prev?.messages || [];
          const next = d.data.messages || [];
          const changed = !silent || prevMsgs.length !== next.length ||
            (next.length && prevMsgs.length && next[next.length - 1].id !== prevMsgs[prevMsgs.length - 1].id) ||
            JSON.stringify(prevMsgs.map((m: any) => m.readAt)) !== JSON.stringify(next.map((m: any) => m.readAt));
          if (silent && !changed && prev?.conversationId === d.data.conversationId) return prev;
          if (next.length > prevMsgs.length || !silent) setTimeout(() => bottomRef.current?.scrollIntoView(silent ? { behavior: "smooth" } : undefined), 50);
          return d.data;
        });
      } else if (!silent) {
        setThread({ other: null, messages: [], conversationId: id, error: d.error || "Could not open conversation" });
      }
    } catch {
      if (!silent) setThread({ other: null, messages: [], conversationId: id, error: "Network error" });
    }
  }

  function openConvo(id: string) {
    // Push a history entry so the phone's back button closes the chat first.
    if (typeof window !== "undefined") window.history.pushState({ chat: id }, "");
    setActive(id);
    setThread(null);
    const t = localStorage.getItem("token") || token;
    if (t) loadThread(id, t);
  }
  // Close the open chat — go back in history so state stays consistent.
  function closeConvo() {
    if (typeof window !== "undefined" && window.history.state?.chat) window.history.back();
    else { setActive(null); setThread(null); }
  }
  async function send(imageUrl?: string, audio?: { url: string; duration: number }) {
    if ((!body.trim() && !imageUrl && !audio) || !active) return;
    const text = body.trim();
    setBody("");
    await fetch(`${API_URL}/api/messages/${active}/send`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: text, imageUrl, audioUrl: audio?.url, audioDuration: audio?.duration }),
    });
    loadThread(active, token);
    loadInbox(token);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  const [sendingImg, setSendingImg] = useState(false);
  async function sendPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    setSendingImg(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const r = await fetch(`${API_URL}/api/upload/presign`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contentType: file.type, fileExtension: ext }),
      }).then(r => r.json());
      if (r.success) {
        await fetch(r.data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        await send(r.data.publicUrl);
      }
    } catch {}
    setSendingImg(false);
    e.target.value = "";
  }

  // ---- Voice notes (WhatsApp-style hold/tap to record) ----
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recTimerRef = useRef<any>(null);
  const cancelledRef = useRef(false);
  const recSecsRef = useRef(0);

  async function startRecording() {
    if (recording || !active) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Prefer mp4/aac on iOS, fall back to webm.
      const mime = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      cancelledRef.current = false;
      rec.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        const duration = recSecsRef.current;
        setRecording(false);
        setRecSecs(0);
        if (cancelledRef.current || duration < 1) return; // discard taps/cancels
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        await uploadVoice(blob, duration);
      };
      mediaRecRef.current = rec;
      rec.start();
      setRecording(true);
      setRecSecs(0);
      recSecsRef.current = 0;
      recTimerRef.current = setInterval(() => { recSecsRef.current += 1; setRecSecs(s => s + 1); }, 1000);
    } catch {
      alert("Microphone access is needed to record a voice note.");
    }
  }
  function stopRecording(cancel = false) {
    cancelledRef.current = cancel;
    mediaRecRef.current?.stop();
  }
  async function uploadVoice(blob: Blob, duration: number) {
    setSendingVoice(true);
    try {
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      const r = await fetch(`${API_URL}/api/upload/presign`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contentType: blob.type || "audio/webm", fileExtension: ext }),
      }).then(r => r.json());
      if (r.success) {
        await fetch(r.data.uploadUrl, { method: "PUT", headers: { "Content-Type": blob.type || "audio/webm" }, body: blob });
        await send(undefined, { url: r.data.publicUrl, duration });
      }
    } catch {}
    setSendingVoice(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Hide page heading on mobile when a chat is open, to maximise space */}
        <div className={`items-center justify-between mb-5 ${active ? "hidden md:flex" : "flex"}`}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><MessageCircle className="w-6 h-6 text-brand-400" /> Messages</h1>
          <button onClick={openNewGroup} className="flex items-center gap-2 bg-brand-500 text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-400 transition-colors">
            <Users className="w-4 h-4" /> New Group
          </button>
        </div>
        {/* When a chat is open on mobile, the chat is fixed to the top of the
            VISUAL viewport and its height tracks window.visualViewport — so as
            the keyboard slides up, the chat shrinks and the composer stays
            pinned directly above the keyboard (iOS-safe, unlike 100dvh). */}
        <div
          className={`grid grid-rows-1 md:grid-cols-3 gap-4 md:h-[72vh] md:!static md:z-auto ${active ? "fixed z-[60] bg-[#0a0a0a]" : "h-[72vh]"}`}
          style={active && isMobile && vvRect ? { position: "fixed", top: vvRect.top, left: vvRect.left, width: vvRect.width, height: vvRect.height } : undefined}
        >
          {/* Inbox */}
          <div className={`md:col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-y-auto ${active ? "hidden md:block" : ""}`}>
            {convos.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-sm">No conversations yet</div>
            ) : convos.map(c => (
              <button key={c.id} onClick={() => openConvo(c.id)} className={`w-full flex items-center gap-3 p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${active === c.id ? "bg-white/5" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  {c.other?.avatarUrl ? <img src={c.other.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : <span className="text-brand-400 font-bold text-sm">{c.other?.firstName?.[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">{c.other?.firstName} {c.other?.lastName?.[0]}.</span>
                    {c.unread > 0 && <span className="bg-brand-500 text-black text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center">{c.unread}</span>}
                  </div>
                  <p className="text-xs text-white/40 truncate">{c.lastMessage?.audioUrl ? "🎤 Voice message" : c.lastMessage?.imageUrl && !c.lastMessage?.body ? "📷 Photo" : c.lastMessage?.body || "New conversation"}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Thread — edge-to-edge full screen on mobile, card on desktop */}
          <div className={`md:col-span-2 bg-white/[0.02] flex flex-col min-h-0 border-white/5 md:border md:rounded-2xl ${!active ? "hidden md:flex" : ""}`}>
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Select a conversation</div>
            ) : !thread ? (
              <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Loading…</div>
            ) : thread.error ? (
              <div className="flex-1 flex items-center justify-center text-red-400 text-sm">{thread.error}</div>
            ) : (
              <>
                <div className="shrink-0 flex items-center gap-3 p-3 border-b border-white/5" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
                  {/* Instagram-style circular back button (mobile full-screen chat) */}
                  <button onClick={closeConvo} className="md:hidden w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 active:scale-90 transition-transform"><ArrowLeft className="w-5 h-5" /></button>
                  <button onClick={() => thread.isGroup && openMembers()} className={`flex items-center gap-3 flex-1 min-w-0 text-left ${thread.isGroup ? "hover:opacity-80" : "cursor-default"}`}>
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 ring-2 ring-brand-500/20">
                      {thread.isGroup ? <Users className="w-5 h-5 text-brand-400" /> : (thread.other?.avatarUrl ? <img src={thread.other.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : <span className="text-brand-400 font-bold">{thread.other?.firstName?.[0]}</span>)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{thread.other?.firstName} {thread.other?.lastName}</div>
                      <div className="text-xs text-white/40 truncate">{thread.isGroup ? `${thread.other?.memberCount || 0} members · tap to manage` : (thread.other?.role === "ORGANIZER" ? "Business" : "Active now")}</div>
                    </div>
                  </button>
                  {/* Real WebRTC voice / video calls (1-1 only). */}
                  {!thread.isGroup && thread.other?.id && (
                    <>
                      <button onClick={() => startCall(thread.other.id, `${thread.other.firstName} ${thread.other.lastName || ""}`.trim(), "audio")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0"><Phone className="w-[18px] h-[18px]" /></button>
                      <button onClick={() => startCall(thread.other.id, `${thread.other.firstName} ${thread.other.lastName || ""}`.trim(), "video")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0"><Video className="w-[18px] h-[18px]" /></button>
                    </>
                  )}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5" style={{ backgroundImage: "radial-gradient(circle at 25% 15%, rgba(34,197,94,0.04), transparent 40%)" }}>
                  {thread.messages.map((m: any) => {
                    // Server tags m.mine; fall back to id comparison if absent.
                    const mine = m.mine ?? (m.senderId === meId);
                    const time = new Date(m.createdAt).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
                    // In groups, show each sender's own avatar/name.
                    const av = thread.isGroup ? m.sender?.avatarUrl : thread.other?.avatarUrl;
                    const initial = thread.isGroup ? m.sender?.firstName?.[0] : thread.other?.firstName?.[0];
                    return (
                      <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                        {!mine && (
                          <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {av ? <img src={av} className="w-full h-full object-cover" alt="" /> : <span className="text-brand-400 text-[11px] font-bold">{initial}</span>}
                          </div>
                        )}
                        <div className={`max-w-[75%] rounded-2xl text-sm shadow-sm overflow-hidden ${m.imageUrl && !m.body ? "" : "px-3 py-2"} ${mine ? "bg-brand-500 text-black rounded-br-md" : "bg-[#2a3942] text-white rounded-bl-md"}`}>
                          {thread.isGroup && !mine && m.sender && (
                            <div className="text-[11px] font-semibold text-brand-400 mb-0.5 px-1 pt-1">{m.sender.firstName} {m.sender.lastName?.[0]}.</div>
                          )}
                          {m.audioUrl && <VoiceNote url={m.audioUrl} duration={m.audioDuration} mine={mine} />}
                          {m.imageUrl && (
                            <a href={m.imageUrl} target="_blank" rel="noopener noreferrer">
                              <img src={m.imageUrl} alt="" className="rounded-xl max-w-full max-h-64 object-cover" />
                            </a>
                          )}
                          {m.body && <span className="whitespace-pre-wrap break-words">{m.body}</span>}
                          <span className={`inline-flex items-center gap-0.5 ml-2 align-bottom text-[10px] ${m.imageUrl && !m.body ? "px-2 pb-1" : ""} ${mine ? "text-black/50" : "text-white/40"}`}>
                            {time}
                            {mine && <span>{m.readAt ? "✓✓" : "✓"}</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="shrink-0 p-3 border-t border-white/5 flex items-center gap-2 relative" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
                  {emojiOpen && (
                    <div className="absolute bottom-16 left-3 bg-[#1a1a1a] border border-white/10 rounded-xl p-2 grid grid-cols-8 gap-1 shadow-2xl z-20 w-72">
                      {EMOJIS.map(e => (
                        <button key={e} type="button" onClick={() => { setBody(b => b + e); }} className="text-xl hover:bg-white/10 rounded p-1">{e}</button>
                      ))}
                    </div>
                  )}
                  {recording ? (
                    /* Recording bar — WhatsApp-style: cancel (bin), timer, send */
                    <div className="flex-1 flex items-center gap-3">
                      <button onClick={() => stopRecording(true)} className="text-red-400 shrink-0" aria-label="Cancel recording"><Trash2 className="w-5 h-5" /></button>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-sm text-white tabular-nums flex-1">{Math.floor(recSecs / 60)}:{(recSecs % 60).toString().padStart(2, "0")}</span>
                      <span className="text-xs text-white/40">slide bin to cancel</span>
                      <button onClick={() => stopRecording(false)} className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center shrink-0 active:scale-90 transition-transform" aria-label="Send voice note"><Send className="w-4 h-4 text-black" /></button>
                    </div>
                  ) : (
                    <>
                      <label className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center shrink-0 hover:bg-brand-400 transition-colors cursor-pointer">
                        {sendingImg ? <span className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" /> : <Camera className="w-4 h-4 text-black" />}
                        <input type="file" accept="image/*" onChange={sendPhoto} className="hidden" />
                      </label>
                      <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-full px-3">
                        <input value={body} onChange={e => setBody(e.target.value)} onFocus={() => setTimeout(() => bottomRef.current?.scrollIntoView({ block: "end" }), 300)} onKeyDown={e => { if (e.key === "Enter") { setEmojiOpen(false); send(); } }} placeholder="Message…" className="flex-1 py-2.5 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none" />
                        <button type="button" onClick={() => setEmojiOpen(o => !o)} className="text-white/40 hover:text-brand-400 transition-colors px-1"><Smile className="w-5 h-5" /></button>
                      </div>
                      {body.trim() ? (
                        <button onClick={() => { setEmojiOpen(false); send(); }} className="text-brand-400 font-semibold text-sm px-2 shrink-0">Send</button>
                      ) : (
                        <>
                          <label className="text-white/50 hover:text-brand-400 shrink-0 cursor-pointer">
                            <ImageIcon className="w-5 h-5" />
                            <input type="file" accept="image/*" onChange={sendPhoto} className="hidden" />
                          </label>
                          <button onClick={startRecording} className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center shrink-0 active:scale-90 hover:bg-brand-400 transition-all" aria-label="Record voice note">
                            {sendingVoice ? <span className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" /> : <Mic className="w-4 h-4 text-black" />}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Group members / admin modal */}
      {membersOpen && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setMembersOpen(false)}>
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Users className="w-5 h-5 text-brand-400" /> Group members</h2>
              <button onClick={() => setMembersOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1 mb-4">
              {members.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                    {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : <span className="text-brand-400 text-xs font-bold">{m.firstName?.[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white">{m.firstName} {m.lastName} {m.isMe && <span className="text-white/30">(you)</span>}</span>
                    {m.isAdmin && <span className="ml-2 text-[10px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full">Admin</span>}
                  </div>
                  {meIsAdmin && !m.isMe && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleAdmin(m.id, !m.isAdmin)} className="text-[11px] text-white/50 hover:text-brand-400 px-2 py-1">{m.isAdmin ? "Demote" : "Make admin"}</button>
                      <button onClick={() => removeMember(m.id)} className="text-[11px] text-red-400/70 hover:text-red-400 px-2 py-1">Remove</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {meIsAdmin && (
              <div>
                <p className="text-xs text-white/40 mb-2">Add from your contacts</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {contacts.filter((u: any) => !members.some((m: any) => m.id === u.id)).map((u: any) => (
                    <button key={u.id} onClick={() => addMember(u.id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left">
                      <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                        {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : <span className="text-brand-400 text-[11px] font-bold">{u.firstName?.[0]}</span>}
                      </div>
                      <span className="text-sm text-white/80 flex-1">{u.firstName} {u.lastName}</span>
                      <span className="text-brand-400 text-sm">+ Add</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New group modal */}
      {groupOpen && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setGroupOpen(false)}>
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Users className="w-5 h-5 text-brand-400" /> New group</h2>
              <button onClick={() => setGroupOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 mb-4" />
            <p className="text-xs text-white/40 mb-2">Add members (people you&apos;ve chatted with)</p>
            <div className="max-h-52 overflow-y-auto space-y-1 mb-4">
              {contacts.length === 0 ? (
                <p className="text-sm text-white/30 py-3 text-center">Start a 1-1 chat first to add people to a group.</p>
              ) : contacts.map((u: any) => (
                <button key={u.id} onClick={() => togglePick(u.id)} className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${groupPicks.includes(u.id) ? "bg-brand-500/15 border border-brand-500/30" : "hover:bg-white/5 border border-transparent"}`}>
                  <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                    {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : <span className="text-brand-400 text-xs font-bold">{u.firstName?.[0]}</span>}
                  </div>
                  <span className="text-sm text-white flex-1">{u.firstName} {u.lastName}</span>
                  {groupPicks.includes(u.id) && <span className="text-brand-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
            <button onClick={createGroup} disabled={!groupName.trim() || groupPicks.length === 0} className="w-full bg-brand-500 text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-400 disabled:opacity-40 transition-colors">
              Create group ({groupPicks.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// WhatsApp-style voice-note bubble: play/pause + progress bar + duration.
function VoiceNote({ url, duration, mine }: { url: string; duration?: number; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const total = duration || 0;

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play().catch(() => {}); }
  }
  function fmt(s: number) {
    const m = Math.floor(s / 60); const ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, "0")}`;
  }
  const accent = mine ? "text-black" : "text-white";
  const track = mine ? "bg-black/20" : "bg-white/20";
  const fill = mine ? "bg-black/60" : "bg-white/70";
  return (
    <div className="flex items-center gap-2 min-w-[180px] py-0.5">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={(e) => { const a = e.currentTarget; if (a.duration) setProgress(a.currentTime / a.duration); }}
      />
      <button onClick={toggle} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${mine ? "bg-black/15" : "bg-white/15"} ${accent}`}>
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className={`h-1 rounded-full ${track} overflow-hidden`}>
          <div className={`h-full ${fill}`} style={{ width: `${Math.max(progress * 100, 2)}%` }} />
        </div>
      </div>
      <span className={`text-[10px] shrink-0 ${mine ? "text-black/60" : "text-white/50"}`}>{fmt(total)}</span>
    </div>
  );
}
