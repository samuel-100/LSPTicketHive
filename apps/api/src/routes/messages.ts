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
  let convo = await prisma.conversation.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
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

// List my conversations (inbox) with last message + unread count.
messagesRouter.get("/", authenticate, async (req: AuthRequest, res) => {
  const me = req.user!.userId;
  const convos = await prisma.conversation.findMany({
    where: { OR: [{ userAId: me }, { userBId: me }] },
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const data = await Promise.all(convos.map(async (c: any) => {
    const other = await withOther(c, me);
    const unread = await prisma.message.count({ where: { conversationId: c.id, senderId: { not: me }, readAt: null } });
    return {
      id: c.id,
      other,
      lastMessage: c.messages[0] || null,
      unread,
      lastMessageAt: c.lastMessageAt,
    };
  }));

  res.json({ success: true, data });
});

// Total unread count (for navbar badge).
messagesRouter.get("/unread-count", authenticate, async (req: AuthRequest, res) => {
  const me = req.user!.userId;
  const convos = await prisma.conversation.findMany({ where: { OR: [{ userAId: me }, { userBId: me }] }, select: { id: true } });
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
  const convo = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!convo || (convo.userAId !== me && convo.userBId !== me)) {
    return res.status(403).json({ success: false, error: "Not your conversation" });
  }
  const rows = await prisma.message.findMany({ where: { conversationId: convo.id }, orderBy: { createdAt: "asc" } });
  await prisma.message.updateMany({ where: { conversationId: convo.id, senderId: { not: me }, readAt: null }, data: { readAt: new Date() } });
  const other = await withOther(convo, me);
  // Tag each message server-side so the client never has to guess who "me" is.
  const messages = rows.map((m: any) => ({ ...m, mine: m.senderId === me }));
  res.json({ success: true, data: { other, messages, conversationId: convo.id } });
});

// Send a message in a conversation.
messagesRouter.post("/:id/send", authenticate, async (req: AuthRequest, res) => {
  const me = req.user!.userId;
  const body = (req.body?.body || "").trim();
  if (!body) return res.status(400).json({ success: false, error: "Message required" });

  const convo = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!convo || (convo.userAId !== me && convo.userBId !== me)) {
    return res.status(403).json({ success: false, error: "Not your conversation" });
  }
  const message = await prisma.message.create({ data: { conversationId: convo.id, senderId: me, body } });
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date() } });
  res.json({ success: true, data: message });
});
