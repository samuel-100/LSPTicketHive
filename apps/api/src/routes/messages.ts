import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, AuthRequest } from "../middleware/auth";

export const messagesRouter = Router();

// Normalize a user pair so each conversation is stored once.
function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function getOrCreateConversation(meId: string, otherId: string, eventId?: string) {
  const [userAId, userBId] = pair(meId, otherId);
  let convo = await prisma.conversation.findFirst({ where: { isGroup: false, userAId, userBId } });
  if (!convo) {
    convo = await prisma.conversation.create({ data: { userAId, userBId, eventId: eventId || null } });
  }
  return convo;
}

// Helper to load the "other" user in a conversation relative to me.
async function withOther(convo: any, meId: string) {
  const otherId = convo.userAId === meId ? convo.userBId : convo.userAId;
  const other = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } });
  return other;
}

// Create a group conversation with a name + member user ids (plus me).
messagesRouter.post("/groups", authenticate, async (req: AuthRequest, res) => {
  const { name, memberIds } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, error: "Group name required" });
  const ids: string[] = Array.from(new Set([req.user!.userId, ...(Array.isArray(memberIds) ? memberIds : [])]));
  if (ids.length < 2) return res.status(400).json({ success: false, error: "Add at least one other member" });

  const convo = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: name.trim(),
      members: { create: ids.map(id => ({ userId: id })) },
    },
  });
  res.json({ success: true, data: { conversationId: convo.id } });
});

// Start (or open) a conversation with another user.
messagesRouter.post("/start", authenticate, async (req: AuthRequest, res) => {
  const { userId, eventId, body } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: "userId required" });
  if (userId === req.user!.userId) return res.status(400).json({ success: false, error: "Can't message yourself" });

  const other = await prisma.user.findUnique({ where: { id: userId } });
  if (!other) return res.status(404).json({ success: false, error: "User not found" });

  const convo = await getOrCreateConversation(req.user!.userId, userId, eventId);

  if (body && body.trim()) {
    await prisma.message.create({ data: { conversationId: convo.id, senderId: req.user!.userId, body: body.trim() } });
    await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date() } });
  }

  res.json({ success: true, data: { conversationId: convo.id } });
});

// Where-clause matching all conversations I'm part of (1-1 or group).
function myConvosWhere(me: string) {
  return { OR: [{ userAId: me }, { userBId: me }, { members: { some: { userId: me } } }] };
}

// Is a user a participant in a conversation?
function isMember(convo: any, me: string, memberIds: string[]) {
  return convo.userAId === me || convo.userBId === me || memberIds.includes(me);
}

// List my conversations (inbox) with last message + unread count.
messagesRouter.get("/", authenticate, async (req: AuthRequest, res) => {
  const me = req.user!.userId;
  const convos = await prisma.conversation.findMany({
    where: myConvosWhere(me),
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, members: true },
  });

  const data = await Promise.all(convos.map(async (c: any) => {
    const unread = await prisma.message.count({ where: { conversationId: c.id, senderId: { not: me }, readAt: null } });
    let other: any = null;
    if (c.isGroup) {
      other = { firstName: c.name || "Group", lastName: "", isGroup: true, memberCount: c.members.length };
    } else {
      other = await withOther(c, me);
    }
    return { id: c.id, isGroup: c.isGroup, name: c.name, other, lastMessage: c.messages[0] || null, unread, lastMessageAt: c.lastMessageAt };
  }));

  res.json({ success: true, data });
});

// Total unread count (for navbar badge).
messagesRouter.get("/unread-count", authenticate, async (req: AuthRequest, res) => {
  const me = req.user!.userId;
  const convos = await prisma.conversation.findMany({ where: myConvosWhere(me), select: { id: true } });
  const count = await prisma.message.count({ where: { conversationId: { in: convos.map((c: any) => c.id) }, senderId: { not: me }, readAt: null } });
  res.json({ success: true, data: { count } });
});

// Business: search promoters by name or interest. (Before /:id to avoid clash.)
messagesRouter.get("/promoters/search", authenticate, async (req: AuthRequest, res) => {
  const q = (req.query.q as string || "").trim();
  const promoters = await prisma.user.findMany({
    where: {
      isPromoter: true,
      ...(q ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { promoterInterests: { has: q } },
        ],
      } : {}),
    },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, promoterInterests: true, promoterBio: true },
    take: 50,
  });
  res.json({ success: true, data: promoters });
});

// Get a single conversation's messages + mark incoming as read.
messagesRouter.get("/:id", authenticate, async (req: AuthRequest, res) => {
  const me = req.user!.userId;
  const convo = await prisma.conversation.findUnique({ where: { id: req.params.id }, include: { members: true } });
  if (!convo || !isMember(convo, me, convo.members.map((m: any) => m.userId))) {
    return res.status(403).json({ success: false, error: "Not your conversation" });
  }
  const rows = await prisma.message.findMany({ where: { conversationId: convo.id }, orderBy: { createdAt: "asc" } });
  await prisma.message.updateMany({ where: { conversationId: convo.id, senderId: { not: me }, readAt: null }, data: { readAt: new Date() } });

  let other: any;
  if (convo.isGroup) {
    other = { firstName: convo.name || "Group", lastName: "", isGroup: true, memberCount: convo.members.length };
  } else {
    other = await withOther(convo, me);
  }

  // For groups, attach sender name/avatar to each message.
  const senderIds = Array.from(new Set(rows.map((m: any) => m.senderId)));
  const senders = convo.isGroup
    ? await prisma.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, firstName: true, lastName: true, avatarUrl: true } })
    : [];
  const senderMap = new Map(senders.map((s: any) => [s.id, s]));

  const messages = rows.map((m: any) => ({ ...m, mine: m.senderId === me, sender: convo.isGroup ? senderMap.get(m.senderId) : undefined }));
  res.json({ success: true, data: { other, messages, conversationId: convo.id, isGroup: convo.isGroup } });
});

// Send a message in a conversation.
messagesRouter.post("/:id/send", authenticate, async (req: AuthRequest, res) => {
  const me = req.user!.userId;
  const body = (req.body?.body || "").trim();
  if (!body) return res.status(400).json({ success: false, error: "Message required" });

  const convo = await prisma.conversation.findUnique({ where: { id: req.params.id }, include: { members: true } });
  if (!convo || !isMember(convo, me, convo.members.map((m: any) => m.userId))) {
    return res.status(403).json({ success: false, error: "Not your conversation" });
  }
  const message = await prisma.message.create({ data: { conversationId: convo.id, senderId: me, body } });
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date() } });
  res.json({ success: true, data: message });
});
