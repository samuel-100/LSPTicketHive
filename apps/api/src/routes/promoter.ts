import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { sendEmail } from "../services/email";

export const promoterRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "https://lsptickethive.com";

// Business posts a "promoter brief" for one of their events, and we notify
// promoters whose interests match the event category.
promoterRouter.post("/requests", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
  const { eventId, commissionRate, targetAudience, note } = req.body;
  if (!eventId) return res.status(400).json({ success: false, error: "eventId required" });

  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.status(403).json({ success: false, error: "Not authorized" });

  const event = await prisma.event.findFirst({ where: { id: eventId, organizationId: org.id } });
  if (!event) return res.status(404).json({ success: false, error: "Event not found" });

  // Make sure the event is open to promoters with this commission.
  await prisma.event.update({
    where: { id: event.id },
    data: { promotable: true, ...(commissionRate ? { commissionRate: Number(commissionRate) } : {}) },
  });

  const request = await prisma.promoterRequest.create({
    data: {
      organizationId: org.id,
      eventId: event.id,
      category: event.category,
      commissionRate: commissionRate ? Number(commissionRate) : event.commissionRate,
      targetAudience: targetAudience || null,
      note: note || null,
    },
  });

  // Auto-notify promoters whose interests match the category (fire-and-forget).
  (async () => {
    const promoters = await prisma.user.findMany({
      where: { isPromoter: true, ...(event.category ? { promoterInterests: { has: event.category } } : {}) },
      select: { email: true, firstName: true },
      take: 500,
    });
    for (const p of promoters) {
      await sendEmail(
        p.email,
        `New promo opportunity: ${event.title}`,
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px;">
          <p style="color:#22c55e;font-weight:bold;">${org.name} wants promoters!</p>
          <h2 style="color:#fff;">${event.title}</h2>
          <p style="color:#9ca3af;">Earn <b style="color:#22c55e;">${request.commissionRate}%</b> commission.${targetAudience ? ` Target: ${targetAudience}.` : ""}</p>
          ${note ? `<p style="color:#9ca3af;">"${note}"</p>` : ""}
          <a href="${FRONTEND_URL}/promote" style="display:inline-block;background:#22c55e;color:#000;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:12px;">View opportunity</a>
        </div>`,
        `${org.name} wants promoters for ${event.title} — earn ${request.commissionRate}%. View: ${FRONTEND_URL}/promote`
      );
    }
  })().catch(console.error);

  res.status(201).json({ success: true, data: request });
});

// Promoter: list open opportunities, interest-matched first.
promoterRouter.get("/opportunities", authenticate, async (req: AuthRequest, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  const interests = me?.promoterInterests || [];

  const requests = await prisma.promoterRequest.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  // Hydrate with event + org details.
  const data = await Promise.all(requests.map(async (r: any) => {
    const event = await prisma.event.findUnique({
      where: { id: r.eventId },
      select: { id: true, title: true, coverImageUrl: true, city: true, startDate: true, category: true, status: true },
    });
    if (!event || event.status !== "PUBLISHED") return null;
    const org = await prisma.organization.findUnique({ where: { id: r.organizationId }, select: { name: true, logoUrl: true, ownerId: true } });
    return {
      id: r.id, commissionRate: r.commissionRate, targetAudience: r.targetAudience, note: r.note,
      category: r.category, createdAt: r.createdAt, event, organization: org,
      matchesInterest: r.category ? interests.includes(r.category) : false,
    };
  }));

  const filtered = data.filter(Boolean).sort((a: any, b: any) => Number(b.matchesInterest) - Number(a.matchesInterest));
  res.json({ success: true, data: filtered });
});

// Public marketplace: events open to promoters, with the commission on offer.
promoterRouter.get("/marketplace", async (req, res) => {
  const city = (req.query.city as string || "").trim();
  const where: any = { status: "PUBLISHED", promotable: true, startDate: { gte: new Date() } };
  if (city) where.city = { contains: city, mode: "insensitive" };

  const events = await prisma.event.findMany({
    where,
    include: {
      ticketTypes: { select: { price: true } },
      organization: { select: { name: true, logoUrl: true } },
    },
    orderBy: { startDate: "asc" },
    take: 50,
  });

  // If logged in, prioritise events matching the promoter's interests.
  let interests: string[] = [];
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      const jwt = require("jsonwebtoken");
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-in-production");
      const u = await prisma.user.findUnique({ where: { id: payload.userId } });
      interests = u?.promoterInterests || [];
    } catch { /* ignore */ }
  }

  let mapped = events.map((e: any) => {
    const min = e.ticketTypes.length ? Math.min(...e.ticketTypes.map((t: any) => t.price)) : 0;
    const max = e.ticketTypes.length ? Math.max(...e.ticketTypes.map((t: any) => t.price)) : 0;
    const exampleEarn = Math.round(max * (e.commissionRate / 100) * 100) / 100;
    return {
      id: e.id, title: e.title, coverImageUrl: e.coverImageUrl, city: e.city, venue: e.venue,
      startDate: e.startDate, category: e.category, organization: e.organization,
      commissionRate: e.commissionRate, minPrice: min, maxPrice: max, exampleEarn,
      matchesInterest: interests.includes(e.category),
    };
  });

  if (interests.length) {
    mapped = mapped.sort((a: any, b: any) => Number(b.matchesInterest) - Number(a.matchesInterest));
  }

  res.json({ success: true, data: mapped });
});

// My promotions: distinct events I've driven sales for + my earnings.
promoterRouter.get("/earnings", authenticate, async (req: AuthRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { promoterId: req.user!.userId, status: "COMPLETED" },
    include: { event: { select: { id: true, title: true, coverImageUrl: true, startDate: true } }, tickets: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  let totalEarned = 0, totalSold = 0;
  const byEvent: Record<string, any> = {};
  for (const o of orders) {
    totalEarned += o.commission;
    totalSold += o.tickets.length;
    const id = (o as any).eventId;
    if (!byEvent[id]) byEvent[id] = { event: o.event, earned: 0, sold: 0, orders: 0 };
    byEvent[id].earned += o.commission;
    byEvent[id].sold += o.tickets.length;
    byEvent[id].orders++;
  }

  res.json({
    success: true,
    data: {
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalSold,
      totalOrders: orders.length,
      events: Object.values(byEvent).map((e: any) => ({ ...e, earned: Math.round(e.earned * 100) / 100 })),
    },
  });
});

// Record a click on a referral link (lightweight, fire-and-forget).
promoterRouter.post("/track/:eventId", async (req, res) => {
  // Clicks are not persisted yet (sales are what matter); endpoint reserved for analytics.
  res.json({ success: true });
});
