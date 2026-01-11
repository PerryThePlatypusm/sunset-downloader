import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
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
app.get("/api/ping", (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? "pong";
  res.json({
    message: ping,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.post("/api/bug-report", upload.single("attachment"), handleBugReport);
app.get("/api/demo", handleDemo);
app.post("/api/download", handleDownload);
app.post("/api/validate-url", validateUrl);
app.get("/api/test-webhook", handleTestWebhook);
app.get("/api/discord-greeting", handleDiscordGreeting);

// 404 handler for API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Vercel serverless function handler
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
