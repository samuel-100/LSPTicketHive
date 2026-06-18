import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { sendNewEventNotification } from "../services/email";

export const eventsRouter = Router();

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  shortDesc: z.string().max(300).optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  timezone: z.string().default("UTC"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  totalCapacity: z.number().int().positive(),
  ticketTypes: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    currency: z.string().default("USD"),
    quantity: z.number().int().positive(),
    maxPerOrder: z.number().int().positive().default(10),
    salesStart: z.string().datetime().optional(),
    salesEnd: z.string().datetime().optional(),
  })).min(1),
});

// Public: list published events
eventsRouter.get("/", async (req, res) => {
  const { page = "1", limit = "20", category, city, search, sort } = req.query;
  const pageNum = Math.max(1, parseInt(page as string));
  const pageSize = Math.min(50, parseInt(limit as string));

  const where: any = { status: "PUBLISHED", startDate: { gte: new Date() } };
  if (category) where.category = category;
  if (city) where.city = { contains: city as string, mode: "insensitive" };
  if (search) where.title = { contains: search as string, mode: "insensitive" };

  // Sort options: date (default), soon, new. "popular" handled below.
  let orderBy: any = { startDate: "asc" };
  if (sort === "new") orderBy = { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { ticketTypes: true, organization: { select: { id: true, name: true, slug: true, logoUrl: true } } },
      orderBy,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.event.count({ where }),
  ]);

  // "popular" = most tickets sold (computed in-memory for the page).
  let sorted = items;
  if (sort === "popular") {
    sorted = [...items].sort((a: any, b: any) => {
      const sold = (e: any) => e.ticketTypes.reduce((s: number, t: any) => s + t.sold, 0);
      return sold(b) - sold(a);
    });
  }

  res.json({ success: true, data: { items: sorted, total, page: pageNum, pageSize, hasMore: pageNum * pageSize < total } });
});

// Category counts for the discovery page (only upcoming published events).
eventsRouter.get("/meta/categories", async (_req, res) => {
  const grouped = await prisma.event.groupBy({
    by: ["category"],
    where: { status: "PUBLISHED", startDate: { gte: new Date() } },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const g of grouped) if (g.category) counts[g.category] = g._count._all;
  res.json({ success: true, data: counts });
});

// Trending = most tickets sold among upcoming events.
eventsRouter.get("/meta/trending", async (_req, res) => {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", startDate: { gte: new Date() } },
    include: { ticketTypes: true, organization: { select: { name: true } } },
    take: 30,
  });
  const ranked = events
    .map((e: any) => ({ ...e, _sold: e.ticketTypes.reduce((s: number, t: any) => s + t.sold, 0) }))
    .sort((a: any, b: any) => b._sold - a._sold)
    .slice(0, 8);
  res.json({ success: true, data: ranked });
});

// Public: get single event
eventsRouter.get("/:id", async (req, res) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.id },
    include: {
      ticketTypes: true,
      organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
  });

  if (!event) return res.status(404).json({ success: false, error: "Event not found" });
  res.json({ success: true, data: event });
});

// Organizer: create event
eventsRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== "ORGANIZER" && req.user!.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "Only business accounts can create events. Switch to a business account in your profile." });
  }
  try {
    const input = createEventSchema.parse(req.body);

    const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
    if (!org) return res.status(400).json({ success: false, error: "Create an organization first" });

    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const event = await prisma.event.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        shortDesc: input.shortDesc,
        venue: input.venue,
        address: input.address,
        city: input.city,
        country: input.country,
        isOnline: input.isOnline,
        onlineUrl: input.onlineUrl,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        timezone: input.timezone,
        category: input.category,
        tags: input.tags || [],
        totalCapacity: input.totalCapacity,
        organizationId: org.id,
        ticketTypes: {
          create: input.ticketTypes,
        },
      },
      include: { ticketTypes: true },
    });

    // Publish immediately and notify followers
    await prisma.event.update({ where: { id: event.id }, data: { status: "PUBLISHED" } });

    // Notify followers in background (don't block response)
    notifyFollowers(org.id, org.name, event.id, event.title, event.startDate, event.venue || "").catch(console.error);

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Organizer: update event
eventsRouter.patch("/:id", authenticate, async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.status(403).json({ success: false, error: "Not authorized" });

  const { title, description, shortDesc, venue, city, country, category, startDate, endDate, totalCapacity, coverImageUrl } = req.body;

  const event = await prisma.event.findFirst({ where: { id: req.params.id, organizationId: org.id } });
  if (!event) return res.status(404).json({ success: false, error: "Event not found" });

  const updated = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(shortDesc !== undefined && { shortDesc }),
      ...(venue !== undefined && { venue }),
      ...(city !== undefined && { city }),
      ...(country !== undefined && { country }),
      ...(category && { category }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(totalCapacity && { totalCapacity: Number(totalCapacity) }),
      ...(coverImageUrl !== undefined && { coverImageUrl }),
    },
  });

  res.json({ success: true, data: updated });
});

// Organizer: publish event
eventsRouter.patch("/:id/publish", authenticate, async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.status(403).json({ success: false, error: "Not authorized" });

  const event = await prisma.event.updateMany({
    where: { id: req.params.id, organizationId: org.id, status: "DRAFT" },
    data: { status: "PUBLISHED" },
  });

  if (event.count === 0) return res.status(404).json({ success: false, error: "Event not found or already published" });
  res.json({ success: true, message: "Event published" });
});

// Organizer: list own events
eventsRouter.get("/my/events", authenticate, async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.json({ success: true, data: [] });

  const events = await prisma.event.findMany({
    where: { organizationId: org.id },
    include: { ticketTypes: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: events });
});

// Organizer: get event attendees (who bought tickets)
eventsRouter.get("/:id/attendees", authenticate, async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.status(403).json({ success: false, error: "Not authorized" });

  const event = await prisma.event.findFirst({ where: { id: req.params.id, organizationId: org.id } });
  if (!event) return res.status(404).json({ success: false, error: "Event not found" });

  const tickets = await prisma.ticket.findMany({
    where: { ticketType: { eventId: event.id } },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      ticketType: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const checkedIn = tickets.filter((t: any) => t.status === "USED").length;

  res.json({
    success: true,
    data: {
      total: tickets.length,
      checkedIn,
      attendees: tickets.map((t: any) => ({
        id: t.id,
        user: t.user,
        ticketType: t.ticketType.name,
        price: t.ticketType.price,
        status: t.status,
        checkedInAt: t.checkedInAt,
        createdAt: t.createdAt,
      })),
    },
  });
});

// Organizer: get followers
eventsRouter.get("/:id/followers", authenticate, async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.status(403).json({ success: false, error: "Not authorized" });

  const followers = await prisma.follow.findMany({
    where: { organizationId: org.id },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: {
      total: followers.length,
      followers: followers.map((f: any) => ({ ...f.user, followedAt: f.createdAt })),
    },
  });
});

async function notifyFollowers(orgId: string, orgName: string, eventId: string, eventTitle: string, startDate: Date, venue: string) {
  const followers = await prisma.follow.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { email: true, firstName: true } } },
  });

  const dateStr = startDate.toLocaleDateString("en-IE", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  for (const follow of followers) {
    await sendNewEventNotification(
      (follow as any).user.email,
      (follow as any).user.firstName,
      orgName,
      eventTitle,
      eventId,
      dateStr,
      venue
    );
  }

  console.log(`Notified ${followers.length} followers about: ${eventTitle}`);
}
