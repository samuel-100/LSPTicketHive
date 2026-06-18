import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

export const checkInRouter = Router();

// Check in a ticket via QR code
checkInRouter.post("/scan", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
  const { qrCode } = req.body;
  if (!qrCode) return res.status(400).json({ success: false, error: "QR code required" });

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: {
      ticketType: { include: { event: { include: { organization: true } } } },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!ticket) return res.status(404).json({ success: false, error: "Ticket not found" });

  // Verify organizer owns this event
  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org || ticket.ticketType.event.organizationId !== org.id) {
    return res.status(403).json({ success: false, error: `Wrong event! This ticket is for "${ticket.ticketType.event.title}", not your event.` });
  }

  // If scanning for a specific event, reject tickets that belong to a different one.
  const scopedEventId = req.body?.eventId;
  if (scopedEventId && ticket.ticketType.event.id !== scopedEventId) {
    return res.status(409).json({ success: false, error: `This ticket is for "${ticket.ticketType.event.title}", not the event you're scanning for.` });
  }

  if (ticket.status === "USED") {
    const usedAt = ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" }) : "unknown time";
    return res.status(409).json({
      success: false,
      error: `Already scanned at ${usedAt}`,
      data: { checkedInAt: ticket.checkedInAt },
    });
  }

  if (ticket.status !== "VALID") {
    return res.status(400).json({ success: false, error: `Ticket status: ${ticket.status}` });
  }

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "USED", checkedInAt: new Date() },
  });

  const scanTime = updated.checkedInAt ? new Date(updated.checkedInAt).toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" }) : "";

  res.json({
    success: true,
    data: {
      ticketId: updated.id,
      attendee: ticket.user,
      ticketType: ticket.ticketType.name,
      eventTitle: ticket.ticketType.event.title,
      checkedInAt: updated.checkedInAt,
      scanTime,
    },
  });
});

// Owner: search attendees across all your events by name or email.
// Used at the door when someone lost access to their phone/email.
checkInRouter.get("/lookup", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
  const q = (req.query.q as string || "").trim();
  if (q.length < 2) return res.json({ success: true, data: [] });

  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.status(403).json({ success: false, error: "Not authorized" });

  // Optionally scope to a single event.
  const scopedEventId = req.query.eventId as string | undefined;

  // Only tickets for events owned by this organization, matching the search.
  const tickets = await prisma.ticket.findMany({
    where: {
      ticketType: { event: scopedEventId ? { id: scopedEventId, organizationId: org.id } : { organizationId: org.id } },
      OR: [
        { user: { firstName: { contains: q, mode: "insensitive" } } },
        { user: { lastName: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { qrCode: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
      ticketType: { select: { name: true, event: { select: { title: true, startDate: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({
    success: true,
    data: tickets.map((t: any) => ({
      ticketId: t.id,
      qrCode: t.qrCode,
      status: t.status,
      checkedInAt: t.checkedInAt,
      attendee: t.user,
      ticketType: t.ticketType.name,
      eventTitle: t.ticketType.event.title,
      eventDate: t.ticketType.event.startDate,
    })),
  });
});

// Get check-in stats for an event
checkInRouter.get("/stats/:eventId", authenticate, requireRole("ORGANIZER", "ADMIN"), async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({ where: { ownerId: req.user!.userId } });
  if (!org) return res.status(403).json({ success: false, error: "Not authorized" });

  const event = await prisma.event.findFirst({
    where: { id: req.params.eventId, organizationId: org.id },
  });
  if (!event) return res.status(404).json({ success: false, error: "Event not found" });

  const [total, checkedIn] = await Promise.all([
    prisma.ticket.count({ where: { ticketType: { eventId: event.id }, status: { in: ["VALID", "USED"] } } }),
    prisma.ticket.count({ where: { ticketType: { eventId: event.id }, status: "USED" } }),
  ]);

  res.json({ success: true, data: { total, checkedIn, remaining: total - checkedIn } });
});
