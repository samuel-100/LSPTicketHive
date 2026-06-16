import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/auth";
import { eventsRouter } from "./routes/events";
import { ordersRouter } from "./routes/orders";
import { webhooksRouter } from "./routes/webhooks";
import { organizationsRouter } from "./routes/organizations";
import { checkInRouter } from "./routes/checkin";
import { uploadRouter } from "./routes/upload";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(morgan("combined"));

app.use("/api/webhooks", webhooksRouter);

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/checkin", checkInRouter);
app.use("/api/upload", uploadRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`LSPTicketHive API running on port ${PORT}`);
});

export default app;
