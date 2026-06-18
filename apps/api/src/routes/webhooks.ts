import { Router, raw } from "express";
import { prisma } from "@lsp-tickethive/database";
import Stripe from "stripe";
import crypto from "crypto";
import { sendTicketConfirmation } from "../services/email";

export const webhooksRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-04-10" });

webhooksRouter.post("/stripe", raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed");
    return res.status(400).send("Invalid signature");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { orderId, eventId, userId, items } = session.metadata || {};

      if (!orderId || !items) {
        console.error("checkout.session.completed missing metadata", session.id);
        break;
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) break;
      // Idempotency: Stripe can deliver the same event more than once.
      if (order.status === "COMPLETED") break;

      const lineItems = JSON.parse(items);
      const paymentId = typeof session.payment_intent === "string" ? session.payment_intent : session.id;

      // Create tickets and update order status atomically.
      await prisma.$transaction(async (tx: any) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "COMPLETED", stripePaymentId: paymentId },
        });

        for (const item of lineItems) {
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { sold: { increment: item.quantity } },
          });

          const tickets = Array.from({ length: item.quantity }, () => ({
            qrCode: crypto.randomUUID(),
            ticketTypeId: item.ticketTypeId,
            orderId: order.id,
            userId: userId || order.userId,
          }));

          await tx.ticket.createMany({ data: tickets });
        }
      });

      // Email the buyer their tickets (QR codes + IDs).
      try {
        const fullOrder = await prisma.order.findUnique({
          where: { id: order.id },
          include: {
            user: true,
            event: true,
            tickets: { include: { ticketType: { select: { name: true } } } },
          },
        });
        if (fullOrder?.user && fullOrder.event) {
          const dateStr = new Date(fullOrder.event.startDate).toLocaleDateString("en-IE", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
          await sendTicketConfirmation(
            fullOrder.user.email,
            fullOrder.user.firstName,
            fullOrder.event.title,
            dateStr,
            fullOrder.event.venue || "",
            fullOrder.id,
            fullOrder.tickets.map((t: any) => ({ qrCode: t.qrCode, ticketType: t.ticketType.name }))
          );
        }
      } catch (e) {
        console.error("Ticket email failed:", e);
      }

      console.log(`Order ${order.id} completed — tickets issued`);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
      }
      break;
    }
  }

  res.json({ received: true });
});
