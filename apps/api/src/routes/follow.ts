import { Router } from "express";
import { prisma } from "@lsp-tickethive/database";
import { authenticate, AuthRequest } from "../middleware/auth";

export const followRouter = Router();

followRouter.post("/:orgId", authenticate, async (req: AuthRequest, res) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.params.orgId } });
    if (!org) return res.status(404).json({ success: false, error: "Organization not found" });

    await prisma.follow.create({
      data: { userId: req.user!.userId, organizationId: req.params.orgId },
    });

    res.json({ success: true, data: { following: true } });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.json({ success: true, data: { following: true, alreadyFollowing: true } });
    }
    res.status(500).json({ success: false, error: "Failed to follow" });
  }
});

followRouter.delete("/:orgId", authenticate, async (req: AuthRequest, res) => {
  await prisma.follow.deleteMany({
    where: { userId: req.user!.userId, organizationId: req.params.orgId },
  });
  res.json({ success: true, data: { following: false } });
});

followRouter.get("/check/:orgId", authenticate, async (req: AuthRequest, res) => {
  const follow = await prisma.follow.findUnique({
    where: { userId_organizationId: { userId: req.user!.userId, organizationId: req.params.orgId } },
  });
  res.json({ success: true, data: { following: !!follow } });
});

followRouter.get("/my", authenticate, async (req: AuthRequest, res) => {
  const follows = await prisma.follow.findMany({
    where: { userId: req.user!.userId },
    include: { organization: { select: { id: true, name: true, slug: true, logoUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: follows.map((f: any) => f.organization) });
});

followRouter.get("/count/:orgId", async (req, res) => {
  const count = await prisma.follow.count({ where: { organizationId: req.params.orgId } });
  res.json({ success: true, data: { count } });
});
