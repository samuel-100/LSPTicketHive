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
