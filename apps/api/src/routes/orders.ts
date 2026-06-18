import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import Stripe from "stripe";
import { z } from "zod";
import { sendTicketConfirmation } from "../services/email";

export const ordersRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-04-10" as any });

const PLATFORM_FEE_RATE = 0.02;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://34.253.167.18";

const checkoutSchema = z.object({
  eventId: z.string(),
  items: z.array(z.object({
    ticketTypeId: z.string(),
    quantity: z.number().int().positive().max(10),
  })).min(1),
  promoCode: z.string().optional(),
});

// Validate a promo code for an event; returns percentOff (0 if invalid) + the row.
async function resolvePromo(code: string | undefined, eventId: string, organizationId: string) {
  if (!code) return { percentOff: 0, promo: null as any };
  const promo = await prisma.promoCode.findFirst({
    where: { organizationId, code: code.toUpperCase(), active: true },
  });
  if (!promo) return { percentOff: 0, promo: null };
  if (promo.eventId && promo.eventId !== eventId) return { percentOff: 0, promo: null };
  if (promo.expiresAt && promo.expiresAt < new Date()) return { percentOff: 0, promo: null };
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return { percentOff: 0, promo: null };
  return { percentOff: promo.percentOff, promo };
}

ordersRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const input = checkoutSchema.parse(req.body);

    const event = await prisma.event.findFirst({
      where: { id: input.eventId, status: "PUBLISHED" },
      include: { ticketTypes: true, organization: true },
    });

    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    // Resolve any promo code for this org/event.
    const { percentOff, promo } = await resolvePromo(input.promoCode, event.id, event.organizationId);
    const discountMult = (100 - percentOff) / 100;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;
    const orderItems: { ticketTypeId: string; quantity: number; price: number }[] = [];

    for (const item of input.items) {
      const ticketType = event.ticketTypes.find((t: any) => t.id === item.ticketTypeId);
      if (!ticketType) return res.status(400).json({ success: false, error: `Ticket type not found` });

      const available = ticketType.quantity - ticketType.sold;
      if (item.quantity > available) {
        return res.status(400).json({ success: false, error: `Only ${available} tickets left for ${ticketType.name}` });
      }

      const unitPrice = Math.round(ticketType.price * discountMult * 100) / 100;
      subtotal += unitPrice * item.quantity;
      orderItems.push({ ticketTypeId: ticketType.id, quantity: item.quantity, price: unitPrice });

      if (unitPrice > 0) {
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: {
              name: `${ticketType.name} — ${event.title}${percentOff ? ` (${percentOff}% off)` : ""}`,
              description: ticketType.description || undefined,
            },
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity: item.quantity,
        });
      }
    }

    if (subtotal === 0) {
      const order = await prisma.order.create({
        data: {
          subtotal: 0,
          platformFee: 0,
          processingFee: 0,
          total: 0,
          status: "COMPLETED",
          userId: req.user!.userId,
          eventId: event.id,
        },
      });

      if (promo) await prisma.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });

      const createdTickets: { qrCode: string; ticketType: string }[] = [];
      for (const item of orderItems) {
        const tt = event.ticketTypes.find((t: any) => t.id === item.ticketTypeId);
        await prisma.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { sold: { increment: item.quantity } },
        });
        for (let i = 0; i < item.quantity; i++) {
          const ticket = await prisma.ticket.create({
            data: {
              orderId: order.id,
              ticketTypeId: item.ticketTypeId,
              userId: req.user!.userId,
            },
          });
          createdTickets.push({ qrCode: ticket.qrCode, ticketType: tt?.name || "Ticket" });
        }
      }

      // Email the tickets (QR + IDs) to the buyer.
      const buyer = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (buyer) {
        const dateStr = new Date(event.startDate).toLocaleDateString("en-IE", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        sendTicketConfirmation(buyer.email, buyer.firstName, event.title, dateStr, event.venue || "", order.id, createdTickets).catch(console.error);
      }

      return res.json({ success: true, data: { orderId: order.id, free: true, redirectUrl: `${FRONTEND_URL}/events` } });
    }

    const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Platform fee (2%)" },
        unit_amount: Math.round(platformFee * 100),
      },
      quantity: 1,
    });

    const order = await prisma.order.create({
      data: {
        subtotal,
        platformFee,
        processingFee: 0,
        total: subtotal + platformFee,
        status: "PENDING",
        userId: req.user!.userId,
        eventId: event.id,
      },
    });

    if (promo) await prisma.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });

    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${FRONTEND_URL}/orders/${order.id}?success=true`,
      cancel_url: `${FRONTEND_URL}/events/${event.id}?cancelled=true`,
      metadata: {
        orderId: order.id,
        eventId: event.id,
        userId: req.user!.userId,
        items: JSON.stringify(orderItems),
      },
      payment_intent_data: {
        metadata: { orderId: order.id },
      },
    };

    if (event.organization.stripeAccountId) {
      sessionParams.payment_intent_data.application_fee_amount = Math.round(platformFee * 100);
      sessionParams.payment_intent_data.transfer_data = {
        destination: event.organization.stripeAccountId,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ success: true, data: { orderId: order.id, checkoutUrl: session.url } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error("Checkout error:", err);
    res.status(500).json({ success: false, error: "Checkout failed" });
  }
});

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

// Refund / cancel an order. Allowed for the buyer OR the event's organizer.
ordersRouter.post("/:id/refund", authenticate, async (req: AuthRequest, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { event: { include: { organization: true } }, tickets: true },
  });
  if (!order) return res.status(404).json({ success: false, error: "Order not found" });

  const isBuyer = order.userId === req.user!.userId;
  const isOwner = order.event.organization.ownerId === req.user!.userId;
  if (!isBuyer && !isOwner) {
    return res.status(403).json({ success: false, error: "Not authorized to refund this order" });
  }
  if (order.status === "REFUNDED" || order.status === "CANCELLED") {
    return res.status(400).json({ success: false, error: "Order already refunded or cancelled" });
  }
  // Don't refund tickets already used at the door.
  if (order.tickets.some((t: any) => t.status === "USED")) {
    return res.status(400).json({ success: false, error: "Cannot refund — a ticket has already been checked in" });
  }

  // Issue the Stripe refund for paid orders.
  if (order.total > 0 && order.stripePaymentId) {
    try {
      await stripe.refunds.create({ payment_intent: order.stripePaymentId });
    } catch (err: any) {
      console.error("Stripe refund failed:", err?.message);
      return res.status(502).json({ success: false, error: "Payment refund failed — contact support" });
    }
  }

  // Mark order refunded, cancel tickets, return inventory.
  await prisma.$transaction(async (tx: any) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
    await tx.ticket.updateMany({ where: { orderId: order.id }, data: { status: "CANCELLED" } });
    const counts: Record<string, number> = {};
    for (const t of order.tickets) counts[t.ticketTypeId] = (counts[t.ticketTypeId] || 0) + 1;
    for (const [ttId, n] of Object.entries(counts)) {
      await tx.ticketType.update({ where: { id: ttId }, data: { sold: { decrement: n } } });
    }
  });

  res.json({ success: true, data: { refunded: true, amount: order.total } });
});

// Transfer a single ticket to another registered user (by email).
// Regenerates the QR so the previous holder's copy becomes invalid.
ordersRouter.post("/tickets/:ticketId/transfer", authenticate, async (req: AuthRequest, res) => {
  const recipientEmail = (req.body?.email || "").trim().toLowerCase();
  if (!recipientEmail) return res.status(400).json({ success: false, error: "Recipient email required" });

  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.ticketId },
    include: { ticketType: { include: { event: true } } },
  });
  if (!ticket) return res.status(404).json({ success: false, error: "Ticket not found" });
  if (ticket.userId !== req.user!.userId) return res.status(403).json({ success: false, error: "This isn't your ticket" });
  if (ticket.status !== "VALID") return res.status(400).json({ success: false, error: "Only valid (unused) tickets can be transferred" });

  const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } });
  if (!recipient) return res.status(404).json({ success: false, error: "No LSPTicketHive account with that email. Ask them to sign up first." });
  if (recipient.id === req.user!.userId) return res.status(400).json({ success: false, error: "That's your own account" });

  const crypto = require("crypto");
  const newQr = crypto.randomUUID();
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { userId: recipient.id, qrCode: newQr, status: "TRANSFERRED" },
  });
  // Keep it scannable: TRANSFERRED would block check-in, so set back to VALID.
  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "VALID" } });

  // Email the new owner.
  try {
    const ev = ticket.ticketType.event;
    const dateStr = new Date(ev.startDate).toLocaleDateString("en-IE", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    await sendTicketConfirmation(recipient.email, recipient.firstName, ev.title, dateStr, ev.venue || "", ticket.orderId, [{ qrCode: newQr, ticketType: ticket.ticketType.name }]);
  } catch (e) { console.error("Transfer email failed:", e); }

  res.json({ success: true, data: { transferredTo: recipientEmail } });
});

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
