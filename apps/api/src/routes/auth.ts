import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@lsp-tickethive/database";
import { signToken, authenticate, AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { sendVerificationCode, sendPasswordResetCode } from "../services/email";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Thin wrapper so existing call sites stay unchanged.
function sendOTPEmail(email: string, code: string, name: string) {
  return sendVerificationCode(email, code, name);
}

export const authRouter = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || process.env.FRONTEND_URL?.startsWith("https"),
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ATTENDEE", "ORGANIZER"]).default("ATTENDEE"),
  isPromoter: z.boolean().optional(),
  promoterInterests: z.array(z.string()).optional(),
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
        // Organizers can't be promoters; only attendees can opt in.
        isPromoter: input.role === "ATTENDEE" ? !!input.isPromoter : false,
        promoterInterests: input.role === "ATTENDEE" && input.isPromoter ? (input.promoterInterests || []) : [],
      },
    });

    // Send OTP for email verification
    const code = generateOTP();
    await prisma.verificationCode.create({
      data: {
        email: user.email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    sendOTPEmail(user.email, code, user.firstName);

    res.status(201).json({
      success: true,
      data: {
        requiresVerification: true,
        email: user.email,
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

    // Require a verified email before allowing login. Re-issue a code so the
    // user can complete verification instead of being stuck.
    if (!user.emailVerified) {
      const code = generateOTP();
      await prisma.verificationCode.create({
        data: { email: user.email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      });
      sendOTPEmail(user.email, code, user.firstName);
      return res.status(403).json({
        success: false,
        error: "Please verify your email. We just sent you a new code.",
        data: { requiresVerification: true, email: user.email },
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.cookie("token", token, COOKIE_OPTIONS);
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

authRouter.post("/verify", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ success: false, error: "Email and code required" });

  const verification = await prisma.verificationCode.findFirst({
    where: { email, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    return res.status(400).json({ success: false, error: "Invalid or expired code" });
  }

  await prisma.verificationCode.update({ where: { id: verification.id }, data: { used: true } });
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.cookie("token", token, COOKIE_OPTIONS);

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    },
  });
});

authRouter.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  const code = generateOTP();
  await prisma.verificationCode.create({
    data: { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  sendOTPEmail(email, code, user.firstName);
  res.json({ success: true, message: "Code sent" });
});

// Step 1 of password reset: request a code.
// Always returns success so we don't reveal which emails are registered.
authRouter.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const code = generateOTP();
    await prisma.verificationCode.create({
      data: { email, code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    });
    sendPasswordResetCode(email, code, user.firstName);
  }

  res.json({ success: true, message: "If that email is registered, a reset code has been sent." });
});

// Step 2 of password reset: verify the code and set a new password.
const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  password: z.string().min(8),
});

authRouter.post("/reset-password", async (req, res) => {
  try {
    const input = resetPasswordSchema.parse(req.body);

    const verification = await prisma.verificationCode.findFirst({
      where: { email: input.email, code: input.code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!verification) {
      return res.status(400).json({ success: false, error: "Invalid or expired code" });
    }

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const passwordHash = await bcrypt.hash(input.password, 12);
    await prisma.$transaction([
      prisma.verificationCode.update({ where: { id: verification.id }, data: { used: true } }),
      // A successful reset also confirms the user controls the inbox.
      prisma.user.update({ where: { email: input.email }, data: { passwordHash, emailVerified: true } }),
    ]);

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.cookie("token", token, COOKIE_OPTIONS);
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

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ success: true });
});

authRouter.get("/me", authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarUrl: true, phone: true, emailVerified: true, createdAt: true,
      isPromoter: true, promoterInterests: true, promoterBio: true, addresses: true,
      _count: { select: { orders: true, tickets: true, following: true } } },
  });
  res.json({ success: true, data: user });
});

// Update profile. Email/role not editable. Promoter opt-in only for attendees.
authRouter.patch("/me", authenticate, async (req: AuthRequest, res) => {
  const { firstName, lastName, avatarUrl, phone, isPromoter, promoterInterests, promoterBio, addresses } = req.body;
  const me = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  const canPromote = me?.role === "ATTENDEE";
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(phone !== undefined && { phone }),
      ...(addresses !== undefined && { addresses }),
      ...(canPromote && isPromoter !== undefined && { isPromoter: !!isPromoter }),
      ...(canPromote && promoterInterests !== undefined && { promoterInterests }),
      ...(canPromote && promoterBio !== undefined && { promoterBio }),
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarUrl: true, phone: true, isPromoter: true, promoterInterests: true, promoterBio: true, addresses: true },
  });
  res.json({ success: true, data: user });
});

// Upgrade an attendee account to a business (organizer) account.
authRouter.post("/upgrade-to-business", authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { role: "ORGANIZER" },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarUrl: true },
  });
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.json({ success: true, data: { token, user } });
});
