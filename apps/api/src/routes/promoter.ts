import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, AuthRequest } from "../middleware/auth";

export const promoterRouter = Router();

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

  res.json({
    success: true,
    data: events.map((e: any) => {
      const min = e.ticketTypes.length ? Math.min(...e.ticketTypes.map((t: any) => t.price)) : 0;
      const max = e.ticketTypes.length ? Math.max(...e.ticketTypes.map((t: any) => t.price)) : 0;
      // Rough earnings example: commission on the cheapest paid ticket.
      const exampleEarn = Math.round(max * (e.commissionRate / 100) * 100) / 100;
      return {
        id: e.id, title: e.title, coverImageUrl: e.coverImageUrl, city: e.city, venue: e.venue,
        startDate: e.startDate, category: e.category, organization: e.organization,
        commissionRate: e.commissionRate, minPrice: min, maxPrice: max, exampleEarn,
      };
    }),
  });
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
