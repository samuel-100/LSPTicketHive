import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import Stripe from "stripe";
import { z } from "zod";

export const organizationsRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-04-10" });

const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  website: z.string().url().optional(),
});

// Create organization (become a seller)
organizationsRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const input = createOrgSchema.parse(req.body);

    const existing = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
    if (existing) return res.status(409).json({ success: false, error: "Organization already exists" });

    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const org = await prisma.organization.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        website: input.website,
        ownerId: req.user!.userId,
      },
    });

    res.status(201).json({ success: true, data: org });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Connect Stripe account for payouts
organizationsRouter.post("/connect-stripe", authenticate, async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.status(404).json({ success: false, error: "Organization not found" });

  try {
    let accountId = org.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: req.user!.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      });
      accountId = account.id;
      await prisma.organization.update({ where: { id: org.id }, data: { stripeAccountId: accountId } });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/dashboard/settings?stripe=refresh`,
      return_url: `${process.env.FRONTEND_URL}/dashboard/settings?stripe=success`,
      type: "account_onboarding",
    });

    res.json({ success: true, data: { url: accountLink.url } });
  } catch (err) {
    console.error("Stripe connect error:", err);
    res.status(500).json({ success: false, error: "Failed to connect Stripe" });
  }
});

// Public: promoters (organizations) that have upcoming events in a given city.
organizationsRouter.get("/by-city", async (req, res) => {
  const city = (req.query.city as string || "").trim();
  if (!city) return res.json({ success: true, data: [] });

  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", startDate: { gte: new Date() }, city: { contains: city, mode: "insensitive" } },
    select: { organizationId: true, organization: { select: { id: true, name: true, slug: true, logoUrl: true, description: true } } },
  });

  // Dedupe orgs + count their upcoming events in this city.
  const map = new Map<string, any>();
  for (const e of events) {
    const o = e.organization;
    if (!map.has(o.id)) map.set(o.id, { ...o, eventCount: 0 });
    map.get(o.id).eventCount++;
  }

  // Attach follower counts.
  const orgs = Array.from(map.values());
  for (const o of orgs) {
    o.followers = await prisma.follow.count({ where: { organizationId: o.id } });
  }
  orgs.sort((a, b) => b.eventCount - a.eventCount);

  res.json({ success: true, data: orgs });
});

// Get my organization
organizationsRouter.get("/me", authenticate, async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({
    where: { ownerId: req.user!.userId },
    include: { events: { select: { id: true, title: true, status: true, startDate: true } } },
  });
  res.json({ success: true, data: org });
});
