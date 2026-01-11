import type { Handler } from "@netlify/functions";

const handler: Handler = async () => {
  try {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Discord webhook URL not configured",
          success: false,
        }),
      };
    }

    const greetingEmbed = {
      title: "👋 Hello from SunsetDownloader!",
      description: "Jacob says hi! 😊",
      color: 0xff6b6b,
      fields: [
        {
          name: "Message",
          value:
            "Hey everyone! The SunsetDownloader bug reporting system is live and ready to catch any issues. Thanks for testing it out! 🚀",
          inline: false,
        },
        {
          name: "Status",
          value: "✅ All systems operational",
          inline: true,
        },
        {
          name: "Timestamp",
          value: new Date().toISOString(),
          inline: true,
        },
      ],
      footer: {
        text: "SunsetDownloader - Multi-Platform Media Downloader",
      },
    };

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "👋 Hey everyone!",
        embeds: [greetingEmbed],
      }),
    });

    if (!response.ok) {
      console.error(
        "Discord greeting failed:",
        response.status,
        response.statusText,
      );
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Discord API error: ${response.statusText}`,
          success: false,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Greeting sent to Discord successfully!",
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Discord greeting error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to send greeting",
        success: false,
      }),
    };
  }
};

export { handler };
