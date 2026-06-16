import { Router, raw } from "express";
import { prisma } from "@lsp-tickethive/database";
import Stripe from "stripe";
import crypto from "crypto";

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
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { eventId, userId, items } = paymentIntent.metadata;

      const order = await prisma.order.findFirst({
        where: { stripePaymentId: paymentIntent.id },
      });

      if (!order) break;

      const lineItems = JSON.parse(items);

      // Create tickets and update order status
      await prisma.$transaction(async (tx: any) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "COMPLETED" },
        });

        for (const item of lineItems) {
          // Update sold count
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { sold: { increment: item.quantity } },
          });

          // Create individual tickets
          const tickets = Array.from({ length: item.quantity }, () => ({
            qrCode: crypto.randomUUID(),
            ticketTypeId: item.ticketTypeId,
            orderId: order.id,
            userId,
          }));

          await tx.ticket.createMany({ data: tickets });
        }
      });

      console.log(`Order ${order.id} completed — tickets issued`);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await prisma.order.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: { status: "CANCELLED" },
      });
      break;
    }
  }

  res.json({ received: true });
});
