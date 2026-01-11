import { Handler } from "@netlify/functions";

const handler: Handler = async (event, context) => {
  const ping = process.env.PING_MESSAGE ?? "pong";
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: ping,
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  };
};

export { handler };
