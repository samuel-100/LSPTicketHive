import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "@lsp-tickethive/database";
import { signToken } from "../middleware/auth";

export const oauthRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "https://lsptickethive.com";
const API_URL = process.env.API_URL || "https://lsptickethive.com";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${API_URL}/api/auth/google/callback`,
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error("No email from Google"));

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            firstName: profile.name?.givenName || profile.displayName?.split(" ")[0] || "User",
            lastName: profile.name?.familyName || profile.displayName?.split(" ").slice(1).join(" ") || "",
            passwordHash: "",
            avatarUrl: profile.photos?.[0]?.value,
            emailVerified: true,
            role: "ATTENDEE",
          },
        });
      }

      done(null, { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } as any);
    } catch (err) {
      done(err as Error);
    }
  }));
}

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

oauthRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

oauthRouter.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_failed` }),
  (req, res) => {
    const user = req.user as any;
    const token = signToken({ userId: user.userId, email: user.email, role: user.role });

    res.cookie("token", token, COOKIE_OPTIONS);

    const userJson = encodeURIComponent(JSON.stringify({
      id: user.userId, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role
    }));

    res.redirect(`${FRONTEND_URL}/auth/callback?user=${userJson}`);
  }
);
