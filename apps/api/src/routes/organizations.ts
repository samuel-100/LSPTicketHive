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

// Get my organization
organizationsRouter.get("/me", authenticate, async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({
    where: { ownerId: req.user!.userId },
    include: { events: { select: { id: true, title: true, status: true, startDate: true } } },
  });
  res.json({ success: true, data: org });
});
