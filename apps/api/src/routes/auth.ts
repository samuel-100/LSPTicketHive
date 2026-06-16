import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@lsp-tickethive/database";
import { signToken, authenticate, AuthRequest } from "../middleware/auth";
import { z } from "zod";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ATTENDEE", "ORGANIZER"]).default("ATTENDEE"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/register", async (req, res) => {
  try {
    const input = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

authRouter.get("/me", authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarUrl: true },
  });
  res.json({ success: true, data: user });
});
