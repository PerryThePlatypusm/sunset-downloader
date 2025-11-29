import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "../server/index";

const app = createServer();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
