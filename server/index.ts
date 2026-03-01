import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { handleDemo } from "./routes/demo";
import { handleDownload, validateUrl } from "./routes/download";
import { handleBugReport } from "./routes/bug-report";
import { handleTestWebhook } from "./routes/test-webhook";
import { handleDiscordGreeting } from "./routes/discord-greeting";

const upload = multer({ storage: multer.memoryStorage() });

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Bug report route with multer for file upload
  app.post("/api/bug-report", upload.single("attachment"), handleBugReport);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Download routes
  app.post("/api/download", handleDownload);
  app.post("/api/validate-url", validateUrl);

  // Test webhook
  app.get("/api/test-webhook", handleTestWebhook);

  // Discord greeting
  app.get("/api/discord-greeting", handleDiscordGreeting);

  return app;
}
