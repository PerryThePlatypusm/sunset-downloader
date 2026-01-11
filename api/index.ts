import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { handleDemo } from "../server/routes/demo";
import { handleDownload, validateUrl } from "../server/routes/download";
import { handleBugReport } from "../server/routes/bug-report";
import { handleTestWebhook } from "../server/routes/test-webhook";
import { handleDiscordGreeting } from "../server/routes/discord-greeting";

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/ping", (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? "pong";
  res.json({
    message: ping,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API Routes (without /api prefix since Vercel adds it automatically)
app.post("/bug-report", upload.single("attachment"), handleBugReport);
app.get("/demo", handleDemo);
app.post("/download", handleDownload);
app.post("/validate-url", validateUrl);
app.get("/test-webhook", handleTestWebhook);
app.get("/discord-greeting", handleDiscordGreeting);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Export Express app for Vercel
export default app;
