import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { handleDemo } from "./routes/demo";
import { handleDownload, validateUrl } from "./routes/download";
import { handleBugReport } from "./routes/bug-report";

const upload = multer({ storage: multer.memoryStorage() });

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());

  // Bug report route with multer (must come before json/urlencoded for file upload)
  app.post("/api/bug-report", upload.single("attachment"), handleBugReport);

  // Other JSON/form middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Download routes
  app.post("/api/download", handleDownload);
  app.post("/api/validate-url", validateUrl);

  return app;
}
