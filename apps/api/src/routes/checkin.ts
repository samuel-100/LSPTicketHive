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
