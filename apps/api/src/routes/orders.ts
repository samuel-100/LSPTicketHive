import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import { PLATFORM_FEE_RATE, STRIPE_PROCESSING_RATE, STRIPE_FIXED_FEE } from "@lsp-tickethive/shared";
import Stripe from "stripe";
import { z } from "zod";

export const ordersRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-04-10" });

const checkoutSchema = z.object({
  eventId: z.string(),
  items: z.array(z.object({
    ticketTypeId: z.string(),
    quantity: z.number().int().positive().max(10),
  })).min(1),
});

// Create checkout session
ordersRouter.post("/checkout", authenticate, async (req: AuthRequest, res) => {
  try {
    const input = checkoutSchema.parse(req.body);

    const event = await prisma.event.findFirst({
      where: { id: input.eventId, status: "PUBLISHED" },
      include: { ticketTypes: true, organization: true },
    });

    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    let subtotal = 0;
    const lineItems: { ticketTypeId: string; quantity: number; price: number; name: string }[] = [];

    for (const item of input.items) {
      const ticketType = event.ticketTypes.find(t => t.id === item.ticketTypeId);
      if (!ticketType) return res.status(400).json({ success: false, error: `Ticket type ${item.ticketTypeId} not found` });

      const available = ticketType.quantity - ticketType.sold;
      if (item.quantity > available) {
        return res.status(400).json({ success: false, error: `Only ${available} tickets available for ${ticketType.name}` });
      }
      if (item.quantity > ticketType.maxPerOrder) {
        return res.status(400).json({ success: false, error: `Max ${ticketType.maxPerOrder} per order for ${ticketType.name}` });
      }

      subtotal += ticketType.price * item.quantity;
      lineItems.push({ ticketTypeId: ticketType.id, quantity: item.quantity, price: ticketType.price, name: ticketType.name });
    }

    const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
    const processingFee = Math.round((subtotal * STRIPE_PROCESSING_RATE + STRIPE_FIXED_FEE) * 100) / 100;
    const total = Math.round((subtotal + platformFee + processingFee) * 100) / 100;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // cents
      currency: "usd",
      metadata: {
        eventId: event.id,
        userId: req.user!.userId,
        items: JSON.stringify(lineItems),
      },
      application_fee_amount: Math.round(platformFee * 100),
      transfer_data: event.organization.stripeAccountId ? {
        destination: event.organization.stripeAccountId,
      } : undefined,
    });

    // Create pending order
    const order = await prisma.order.create({
      data: {
        subtotal,
        platformFee,
        processingFee,
        total,
        stripePaymentId: paymentIntent.id,
        userId: req.user!.userId,
        eventId: event.id,
      },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        clientSecret: paymentIntent.client_secret,
        pricing: { subtotal, platformFee, processingFee, total, currency: "USD" },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error("Checkout error:", err);
    res.status(500).json({ success: false, error: "Checkout failed" });
  }
});

// Get user's orders
ordersRouter.get("/my", authenticate, async (req: AuthRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    include: {
      event: { select: { title: true, startDate: true, venue: true, coverImageUrl: true } },
      tickets: { include: { ticketType: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: orders });
});

// Get single order
ordersRouter.get("/:id", authenticate, async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: {
      event: true,
      tickets: { include: { ticketType: true } },
    },
  });

  if (!order) return res.status(404).json({ success: false, error: "Order not found" });
  res.json({ success: true, data: order });
});
