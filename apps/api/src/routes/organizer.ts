import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { sendEmail } from "../services/email";
import { z } from "zod";

export const organizerRouter = Router();

// Helper: the caller's organization, or null.
async function myOrg(userId: string) {
  return prisma.organization.findUnique({ where: { ownerId: userId } });
}

/* ------------------------------ Analytics ------------------------------- */
// Summary + daily revenue/sales series across all the org's events.
organizerRouter.get("/analytics", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
  const org = await myOrg(req.user!.userId);
  if (!org) return res.json({ success: true, data: { totalRevenue: 0, totalSold: 0, totalOrders: 0, series: [], topEvents: [] } });

  const orders = await prisma.order.findMany({
    where: { event: { organizationId: org.id }, status: "COMPLETED" },
    include: { event: { select: { title: true } }, tickets: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });

  let totalRevenue = 0;
  let totalSold = 0;
  const byDay: Record<string, { revenue: number; sold: number }> = {};
  const byEvent: Record<string, { title: string; revenue: number; sold: number }> = {};

  for (const o of orders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    const sold = o.tickets.length;
    totalRevenue += o.subtotal;
    totalSold += sold;
    byDay[day] = byDay[day] || { revenue: 0, sold: 0 };
    byDay[day].revenue += o.subtotal;
    byDay[day].sold += sold;
    const key = (o as any).eventId;
    byEvent[key] = byEvent[key] || { title: o.event.title, revenue: 0, sold: 0 };
    byEvent[key].revenue += o.subtotal;
    byEvent[key].sold += sold;
  }

  const series = Object.entries(byDay).map(([date, v]) => ({ date, revenue: Math.round(v.revenue * 100) / 100, sold: v.sold }));
  const topEvents = Object.values(byEvent).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  res.json({
    success: true,
    data: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSold,
      totalOrders: orders.length,
      series,
      topEvents,
    },
  });
});

/* ---------------------------- CSV attendee export ---------------------------- */
organizerRouter.get("/events/:id/attendees.csv", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
  const org = await myOrg(req.user!.userId);
  if (!org) return res.status(403).send("Not authorized");

  const event = await prisma.event.findFirst({ where: { id: req.params.id, organizationId: org.id } });
  if (!event) return res.status(404).send("Event not found");

  const tickets = await prisma.ticket.findMany({
    where: { ticketType: { eventId: event.id } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      ticketType: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["First Name", "Last Name", "Email", "Ticket Type", "Price", "Status", "Checked In At", "Ticket ID"].join(","),
    ...tickets.map((t: any) =>
      [t.user.firstName, t.user.lastName, t.user.email, t.ticketType.name, t.ticketType.price, t.status, t.checkedInAt || "", t.qrCode].map(esc).join(",")
    ),
  ].join("\n");

  const filename = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attendees.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(rows);
});

/* ----------------------------- Email blast ------------------------------ */
const blastSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  audience: z.enum(["attendees", "followers"]).default("attendees"),
});

organizerRouter.post("/events/:id/blast", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
  try {
    const input = blastSchema.parse(req.body);
    const org = await myOrg(req.user!.userId);
    if (!org) return res.status(403).json({ success: false, error: "Not authorized" });

    const event = await prisma.event.findFirst({ where: { id: req.params.id, organizationId: org.id } });
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    // Build the recipient list (deduped by email).
    let recipients: { email: string; firstName: string }[] = [];
    if (input.audience === "attendees") {
      const tickets = await prisma.ticket.findMany({
        where: { ticketType: { eventId: event.id } },
        include: { user: { select: { email: true, firstName: true } } },
      });
      recipients = tickets.map((t: any) => t.user);
    } else {
      const follows = await prisma.follow.findMany({
        where: { organizationId: org.id },
        include: { user: { select: { email: true, firstName: true } } },
      });
      recipients = follows.map((f: any) => f.user);
    }
    const unique = Array.from(new Map(recipients.map(r => [r.email, r])).values());

    const html = (name: string) => `
      <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#0a0a0a;border-radius:16px;color:#fff;">
        <div style="text-align:center;margin-bottom:20px;"><span style="background:#22c55e;color:#000;padding:6px 14px;border-radius:8px;font-weight:bold;">${org.name}</span></div>
        <h1 style="font-size:20px;margin-bottom:6px;">${input.subject}</h1>
        <p style="color:#9ca3af;font-size:13px;margin-bottom:16px;">Regarding: ${event.title}</p>
        <div style="color:#d1d5db;font-size:14px;line-height:1.6;white-space:pre-wrap;">Hi ${name},\n\n${input.message}</div>
        <p style="color:#4b5563;font-size:11px;margin-top:24px;">Sent via LSPTicketHive because you ${input.audience === "attendees" ? "have a ticket to" : "follow"} this organizer.</p>
      </div>`;

    let sent = 0;
    for (const r of unique) {
      const ok = await sendEmail(r.email, input.subject, html(r.firstName), `${input.subject}\n\nHi ${r.firstName},\n\n${input.message}`);
      if (ok) sent++;
    }

    res.json({ success: true, data: { sent, total: unique.length } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    res.status(500).json({ success: false, error: "Failed to send blast" });
  }
});
