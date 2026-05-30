import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import quizRoutes from "./routes/quizzes.js";
import plannerRoutes from "./routes/planner.js";
import analyticsRoutes from "./routes/analytics.js";
import subjectRoutes from "./routes/subjects.js";
import notesRoutes from "./routes/notes.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_BRANCH_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "learniq-api", version: "1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
