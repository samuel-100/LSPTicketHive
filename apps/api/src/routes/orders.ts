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
});

ordersRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const input = checkoutSchema.parse(req.body);

    const event = await prisma.event.findFirst({
      where: { id: input.eventId, status: "PUBLISHED" },
      include: { ticketTypes: true, organization: true },
    });

    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

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

      subtotal += ticketType.price * item.quantity;
      orderItems.push({ ticketTypeId: ticketType.id, quantity: item.quantity, price: ticketType.price });

      if (ticketType.price > 0) {
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: {
              name: `${ticketType.name} — ${event.title}`,
              description: ticketType.description || undefined,
            },
            unit_amount: Math.round(ticketType.price * 100),
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
