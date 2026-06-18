import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import { z } from "zod";

export const engagementRouter = Router();

/* ----------------------------- Saved events ----------------------------- */

// Toggle save/unsave for an event.
engagementRouter.post("/saved/:eventId", authenticate, async (req: AuthRequest, res) => {
  const { eventId } = req.params;
  const userId = req.user!.userId;

  const existing = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (existing) {
    await prisma.savedEvent.delete({ where: { id: existing.id } });
    return res.json({ success: true, data: { saved: false } });
  }

  await prisma.savedEvent.create({ data: { userId, eventId } });
  res.json({ success: true, data: { saved: true } });
});

// Is a given event saved by me?
engagementRouter.get("/saved/check/:eventId", authenticate, async (req: AuthRequest, res) => {
  const saved = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId: req.user!.userId, eventId: req.params.eventId } },
  });
  res.json({ success: true, data: { saved: !!saved } });
});

// All events I've saved.
engagementRouter.get("/saved", authenticate, async (req: AuthRequest, res) => {
  const saved = await prisma.savedEvent.findMany({
    where: { userId: req.user!.userId },
    include: {
      event: {
        include: {
          ticketTypes: { select: { price: true } },
          organization: { select: { name: true } },
        },
      },
    },
    orderBy: { id: "desc" },
  });
  res.json({ success: true, data: saved.map((s: any) => s.event) });
});

/* --------------------------------- Likes --------------------------------- */

// Public like count + (if logged in) whether I liked it.
engagementRouter.get("/likes/:eventId", async (req: AuthRequest, res) => {
  const count = await prisma.eventLike.count({ where: { eventId: req.params.eventId } });
  let liked = false;
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      const jwt = require("jsonwebtoken");
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-in-production");
      liked = !!(await prisma.eventLike.findUnique({ where: { userId_eventId: { userId: payload.userId, eventId: req.params.eventId } } }));
    } catch { /* not logged in */ }
  }
  res.json({ success: true, data: { count, liked } });
});

// Toggle like.
engagementRouter.post("/likes/:eventId", authenticate, async (req: AuthRequest, res) => {
  const { eventId } = req.params;
  const userId = req.user!.userId;
  const existing = await prisma.eventLike.findUnique({ where: { userId_eventId: { userId, eventId } } });
  if (existing) {
    await prisma.eventLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.eventLike.create({ data: { userId, eventId } });
  }
  const count = await prisma.eventLike.count({ where: { eventId } });
  res.json({ success: true, data: { liked: !existing, count } });
});

/* ------------------------------- Comments -------------------------------- */

engagementRouter.get("/comments/:eventId", async (req, res) => {
  const comments = await prisma.eventComment.findMany({
    where: { eventId: req.params.eventId },
    include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ success: true, data: comments });
});

engagementRouter.post("/comments/:eventId", authenticate, async (req: AuthRequest, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) return res.status(400).json({ success: false, error: "Comment cannot be empty" });
  if (text.length > 1000) return res.status(400).json({ success: false, error: "Comment too long" });

  const comment = await prisma.eventComment.create({
    data: { text, userId: req.user!.userId, eventId: req.params.eventId },
    include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
  });
  res.status(201).json({ success: true, data: comment });
});

engagementRouter.delete("/comments/:id", authenticate, async (req: AuthRequest, res) => {
  // Only the author can delete their comment.
  await prisma.eventComment.deleteMany({ where: { id: req.params.id, userId: req.user!.userId } });
  res.json({ success: true });
});

/* -------------------------------- Reviews -------------------------------- */

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// List reviews for an event (public) + average rating.
engagementRouter.get("/reviews/:eventId", async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { eventId: req.params.eventId },
    include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  const avg = reviews.length
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    : 0;
  res.json({ success: true, data: { reviews, average: Math.round(avg * 10) / 10, count: reviews.length } });
});

// Create or update my review for an event. Only allowed if I have a ticket.
engagementRouter.post("/reviews/:eventId", authenticate, async (req: AuthRequest, res) => {
  try {
    const input = reviewSchema.parse(req.body);
    const { eventId } = req.params;
    const userId = req.user!.userId;

    // Must have bought a ticket to this event to review it.
    const hasTicket = await prisma.ticket.findFirst({
      where: { userId, ticketType: { eventId } },
    });
    if (!hasTicket) {
      return res.status(403).json({ success: false, error: "Only attendees who bought a ticket can review this event." });
    }

    const review = await prisma.review.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: { userId, eventId, rating: input.rating, comment: input.comment },
      update: { rating: input.rating, comment: input.comment },
    });

    res.json({ success: true, data: review });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
