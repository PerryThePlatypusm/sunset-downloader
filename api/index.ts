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

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.post("/api/bug-report", upload.single("attachment"), handleBugReport);
app.get("/api/ping", (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? "ping";
  res.json({ message: ping });
});
app.get("/api/demo", handleDemo);
app.post("/api/download", handleDownload);
app.post("/api/validate-url", validateUrl);
app.get("/api/test-webhook", handleTestWebhook);
app.get("/api/discord-greeting", handleDiscordGreeting);

export default app;
