"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Phone, PhoneOff, Video as VideoIcon, Mic, MicOff, VideoOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
// Derive the ws(s):// signaling URL from the API URL.
const WS_URL = API_URL.replace(/^http/, "ws") + "/api/rtc";

// Public STUN servers are enough for most networks. (A TURN server would be
// needed for strict/symmetric NATs — that's a later add if calls fail to
// connect for some users.)
const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type CallType = "audio" | "video";
type Phase = "idle" | "outgoing" | "incoming" | "connected";

interface CallState {
  phase: Phase;
  callType: CallType;
  peerId: string | null;
  peerName: string;
}

interface CallCtx {
  startCall: (peerId: string, peerName: string, type: CallType) => void;
}

const Ctx = createContext<CallCtx>({ startCall: () => {} });
export const useCall = () => useContext(Ctx);

export default function CallProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<{ id: string; firstName: string } | null>(null);
  const [token, setToken] = useState("");
  const [call, setCall] = useState<CallState>({ phase: "idle", callType: "audio", peerId: null, peerName: "" });
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [secs, setSecs] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<any>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callRef = useRef(call);
  callRef.current = call;

  // Read auth on mount + on auth-change.
  useEffect(() => {
    function sync() {
      const t = localStorage.getItem("token") || "";
      const u = localStorage.getItem("user");
      setToken(t);
      setMe(u ? JSON.parse(u) : null);
    }
    sync();
    window.addEventListener("auth-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("auth-change", sync); window.removeEventListener("storage", sync); };
  }, []);

  const send = useCallback((obj: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(obj));
  }, []);

  // Keep a persistent signaling socket while logged in (so calls can ring).
  useEffect(() => {
    if (!token) return;
    let closed = false;
    let retry: any;
    function connect() {
      const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;
      ws.onmessage = (ev) => handleSignal(JSON.parse(ev.data));
      ws.onclose = () => { if (!closed) retry = setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { closed = true; clearTimeout(retry); wsRef.current?.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Call-duration timer.
  useEffect(() => {
    if (call.phase !== "connected") { setSecs(0); return; }
    const i = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(i);
  }, [call.phase]);

  function fmt(s: number) { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`; }

  function playRingtone() {
    try {
      // Simple oscillator-based ring so we don't need an audio asset.
      const Ctx2 = (window.AudioContext || (window as any).webkitAudioContext);
      const actx = new Ctx2();
      const ring = () => {
        const o = actx.createOscillator(); const g = actx.createGain();
        o.connect(g); g.connect(actx.destination);
        o.frequency.value = 480; g.gain.value = 0.08;
        o.start(); o.stop(actx.currentTime + 0.4);
      };
      ring();
      const id = setInterval(ring, 1500);
      ringtoneRef.current = { stop: () => { clearInterval(id); actx.close().catch(() => {}); } } as any;
    } catch {}
  }
  function stopRingtone() { (ringtoneRef.current as any)?.stop?.(); ringtoneRef.current = null; }

  async function buildPeer(type: CallType, peerId: string) {
    const pc = new RTCPeerConnection(ICE);
    pcRef.current = pc;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    if (localVideoRef.current && type === "video") localVideoRef.current.srcObject = stream;

    pc.onicecandidate = (e) => { if (e.candidate) send({ type: "webrtc-ice", to: peerId, candidate: e.candidate }); };
    pc.ontrack = (e) => {
      const [rs] = e.streams;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rs;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = rs;
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) endCall(false);
    };
    return pc;
  }

  async function handleSignal(msg: any) {
    const cur = callRef.current;
    switch (msg.type) {
      case "call-invite": {
        if (cur.phase !== "idle") { send({ type: "call-reject", to: msg.from }); return; } // busy
        incomingOfferRef.current = null;
        setCall({ phase: "incoming", callType: msg.callType, peerId: msg.from, peerName: msg.fromName || "Incoming call" });
        playRingtone();
        break;
      }
      case "webrtc-offer": {
        // Offer arrives after we accept; set it and answer.
        if (!pcRef.current) { incomingOfferRef.current = msg.sdp; return; }
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        flushIce();
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        send({ type: "webrtc-answer", to: msg.from, sdp: answer });
        break;
      }
      case "webrtc-answer": {
        if (pcRef.current) { await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp)); flushIce(); }
        break;
      }
      case "webrtc-ice": {
        if (pcRef.current?.remoteDescription) await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
        else pendingIceRef.current.push(msg.candidate);
        break;
      }
      case "call-accept": {
        // Callee accepted; we (caller) create the offer.
        stopRingtone();
        setCall(c => ({ ...c, phase: "connected" }));
        const pc = pcRef.current!;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({ type: "webrtc-offer", to: cur.peerId!, sdp: offer });
        break;
      }
      case "call-reject": stopRingtone(); cleanup(); break;
      case "call-cancel": stopRingtone(); cleanup(); break;
      case "call-end": cleanup(); break;
    }
  }

  function flushIce() {
    const pc = pcRef.current; if (!pc) return;
    pendingIceRef.current.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}));
    pendingIceRef.current = [];
  }

  // ---- Public: start an outgoing call ----
  const startCall = useCallback(async (peerId: string, peerName: string, type: CallType) => {
    if (callRef.current.phase !== "idle") return;
    try {
      setCall({ phase: "outgoing", callType: type, peerId, peerName });
      await buildPeer(type, peerId);
      send({ type: "call-invite", to: peerId, callType: type, fromName: me?.firstName || "Someone" });
    } catch {
      alert("Camera/microphone permission is required to call.");
      cleanup();
    }
  }, [me, send]);

  // ---- Accept an incoming call ----
  async function accept() {
    stopRingtone();
    const cur = callRef.current;
    try {
      await buildPeer(cur.callType, cur.peerId!);
      send({ type: "call-accept", to: cur.peerId! });
      setCall(c => ({ ...c, phase: "connected" }));
      // If the offer raced ahead of us, apply it now.
      if (incomingOfferRef.current) {
        await pcRef.current!.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
        flushIce();
        const answer = await pcRef.current!.createAnswer();
        await pcRef.current!.setLocalDescription(answer);
        send({ type: "webrtc-answer", to: cur.peerId!, sdp: answer });
        incomingOfferRef.current = null;
      }
    } catch {
      alert("Camera/microphone permission is required to answer.");
      reject();
    }
  }

  function reject() {
    const cur = callRef.current;
    stopRingtone();
    if (cur.peerId) send({ type: "call-reject", to: cur.peerId });
    cleanup();
  }

  function endCall(notify = true) {
    const cur = callRef.current;
    stopRingtone();
    if (notify && cur.peerId) send({ type: cur.phase === "outgoing" ? "call-cancel" : "call-end", to: cur.peerId });
    cleanup();
  }

  function cleanup() {
    pcRef.current?.close(); pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop()); localStreamRef.current = null;
    pendingIceRef.current = []; incomingOfferRef.current = null;
    setMuted(false); setCamOff(false);
    setCall({ phase: "idle", callType: "audio", peerId: null, peerName: "" });
  }

  function toggleMute() {
    const s = localStreamRef.current; if (!s) return;
    const on = !muted; setMuted(on);
    s.getAudioTracks().forEach(t => (t.enabled = !on));
  }
  function toggleCam() {
    const s = localStreamRef.current; if (!s) return;
    const off = !camOff; setCamOff(off);
    s.getVideoTracks().forEach(t => (t.enabled = !off));
  }

  const overlay = call.phase !== "idle";
  const isVideo = call.callType === "video";

  return (
    <Ctx.Provider value={{ startCall }}>
      {children}
      {/* Hidden media sinks always mounted so audio plays even on audio calls */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {overlay && (
        <div className="fixed inset-0 z-[200] bg-[#0b141a] flex flex-col items-center justify-between text-white" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
          {/* Remote video fills the screen on video calls */}
          {isVideo && call.phase === "connected" && (
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          )}
          {/* Local preview (picture-in-picture) */}
          {isVideo && (
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-6 right-4 w-28 h-40 object-cover rounded-2xl border border-white/20 z-10 bg-black" style={{ marginTop: "env(safe-area-inset-top)" }} />
          )}

          {/* Caller info */}
          <div className="relative z-10 mt-16 flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-brand-500/20 flex items-center justify-center text-4xl font-bold text-brand-400 ring-4 ring-white/10">
              {call.peerName?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="text-2xl font-semibold">{call.peerName}</div>
            <div className="text-white/60 text-sm">
              {call.phase === "outgoing" && "Calling…"}
              {call.phase === "incoming" && `Incoming ${isVideo ? "video" : "voice"} call`}
              {call.phase === "connected" && fmt(secs)}
            </div>
          </div>

          {/* Controls */}
          <div className="relative z-10 mb-12 flex items-center gap-5">
            {call.phase === "incoming" ? (
              <>
                <button onClick={reject} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center active:scale-90 transition-transform"><PhoneOff className="w-7 h-7" /></button>
                <button onClick={accept} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center active:scale-90 transition-transform">{isVideo ? <VideoIcon className="w-7 h-7" /> : <Phone className="w-7 h-7" />}</button>
              </>
            ) : (
              <>
                <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-white text-black" : "bg-white/15"}`}>{muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</button>
                {isVideo && (
                  <button onClick={toggleCam} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${camOff ? "bg-white text-black" : "bg-white/15"}`}>{camOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}</button>
                )}
                <button onClick={() => endCall(true)} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center active:scale-90 transition-transform"><PhoneOff className="w-7 h-7" /></button>
              </>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
