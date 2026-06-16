import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { z } from "zod";

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
  const { page = "1", limit = "20", category, city, search } = req.query;
  const pageNum = Math.max(1, parseInt(page as string));
  const pageSize = Math.min(50, parseInt(limit as string));

  const where: any = { status: "PUBLISHED", startDate: { gte: new Date() } };
  if (category) where.category = category;
  if (city) where.city = { contains: city as string, mode: "insensitive" };
  if (search) where.title = { contains: search as string, mode: "insensitive" };

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { ticketTypes: true, organization: { select: { name: true, slug: true, logoUrl: true } } },
      orderBy: { startDate: "asc" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.event.count({ where }),
  ]);

  res.json({ success: true, data: { items, total, page: pageNum, pageSize, hasMore: pageNum * pageSize < total } });
});

// Public: get single event
eventsRouter.get("/:id", async (req, res) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.id },
    include: {
      ticketTypes: true,
      organization: { select: { name: true, slug: true, logoUrl: true } },
    },
  });

  if (!event) return res.status(404).json({ success: false, error: "Event not found" });
  res.json({ success: true, data: event });
});

// Organizer: create event
eventsRouter.post("/", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
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

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Organizer: publish event
eventsRouter.patch("/:id/publish", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
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
eventsRouter.get("/my/events", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.json({ success: true, data: [] });

  const events = await prisma.event.findMany({
    where: { organizationId: org.id },
    include: { ticketTypes: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: events });
});
