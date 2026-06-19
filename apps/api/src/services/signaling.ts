import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { URL } from "url";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

// Each connected user can have multiple sockets (tabs/devices). We keep them
// all so a call rings on every device the user is logged into.
const peers = new Map<string, Set<AuthedSocket>>();

interface AuthedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

function sendTo(userId: string, payload: any) {
  const set = peers.get(userId);
  if (!set) return false;
  const msg = JSON.stringify(payload);
  let delivered = false;
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) { ws.send(msg); delivered = true; }
  }
  return delivered;
}

// Signaling messages relayed verbatim between caller and callee. The server
// never touches the media — WebRTC is peer-to-peer; we only pass setup data.
//   call-invite   { to, from, fromName, callType, convId }
//   call-accept   { to }
//   call-reject   { to }
//   call-cancel   { to }
//   call-end      { to }
//   webrtc-offer  { to, sdp }
//   webrtc-answer { to, sdp }
//   webrtc-ice    { to, candidate }
const RELAY = new Set([
  "call-invite", "call-accept", "call-reject", "call-cancel", "call-end",
  "webrtc-offer", "webrtc-answer", "webrtc-ice",
]);

export function attachSignaling(server: Server) {
  const wss = new WebSocketServer({ server, path: "/api/rtc" });

  wss.on("connection", (ws: AuthedSocket, req) => {
    try {
      const url = new URL(req.url || "", "http://localhost");
      const token = url.searchParams.get("token") || "";
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      ws.userId = payload.userId;
    } catch {
      ws.close(4001, "unauthorized");
      return;
    }

    const uid = ws.userId!;
    if (!peers.has(uid)) peers.set(uid, new Set());
    peers.get(uid)!.add(ws);
    ws.isAlive = true;

    ws.on("pong", () => { ws.isAlive = true; });

    ws.on("message", (raw) => {
      let msg: any;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (!msg?.type || !RELAY.has(msg.type) || !msg.to) return;
      // Stamp the sender so the recipient always knows who it's from.
      sendTo(msg.to, { ...msg, from: uid });
    });

    ws.on("close", () => {
      const set = peers.get(uid);
      if (set) { set.delete(ws); if (set.size === 0) peers.delete(uid); }
    });
  });

  // Heartbeat: drop dead sockets so calls don't ring a phantom device.
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthedSocket) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  wss.on("close", () => clearInterval(interval));

  return wss;
}
