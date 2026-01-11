import "dotenv/config";
import express, { Request, Response } from "express";
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
app.get("/api/ping", (_req: Request, res: Response) => {
  const ping = process.env.PING_MESSAGE ?? "pong";
  res.json({
    message: ping,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API Routes (with /api prefix for Vercel)
app.post("/api/bug-report", upload.single("attachment"), handleBugReport);
app.get("/api/demo", handleDemo);
app.post("/api/download", handleDownload);
app.post("/api/validate-url", validateUrl);
app.get("/api/test-webhook", handleTestWebhook);
app.get("/api/discord-greeting", handleDiscordGreeting);

// Fallback routes for any other /api/* requests
app.all("/api/*", (_req: Request, res: Response) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: _req.path,
    method: _req.method,
  });
});

// Export Express app for Vercel
export default app;
