import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { authRouter } from "./routes/auth";
import { eventsRouter } from "./routes/events";
import { ordersRouter } from "./routes/orders";
import { webhooksRouter } from "./routes/webhooks";
import { organizationsRouter } from "./routes/organizations";
import { checkInRouter } from "./routes/checkin";
import { uploadRouter } from "./routes/upload";
import { followRouter } from "./routes/follow";
import { engagementRouter } from "./routes/engagement";
import { organizerRouter } from "./routes/organizer";
import { promoterRouter } from "./routes/promoter";
import { oauthRouter } from "./routes/oauth";
import passport from "passport";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:3000", "https://lsptickethive.com", "https://www.lsptickethive.com", "http://34.253.167.18", "http://34.253.167.18:3000"], credentials: true }));
app.use(cookieParser());
app.use(morgan("combined"));

app.use("/api/webhooks", webhooksRouter);

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/checkin", checkInRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/follow", followRouter);
app.use("/api/engagement", engagementRouter);
app.use("/api/organizer", organizerRouter);
app.use("/api/promoter", promoterRouter);
app.use(passport.initialize());
app.use("/api/auth", oauthRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`LSPTicketHive API running on port ${PORT}`);
});

export default app;
