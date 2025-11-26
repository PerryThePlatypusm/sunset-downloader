import { RequestHandler } from "express";

export const handleDiscordGreeting: RequestHandler = async (req, res) => {
  try {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      return res.status(400).json({
        error: "Discord webhook URL not configured",
        success: false,
      });
    }

    const greetingEmbed = {
      title: "👋 Hello from SunsetDownloader!",
      description: "Jacob says hi! 😊",
      color: 0xff6b6b,
      fields: [
        {
          name: "Message",
          value: "Hey everyone! The SunsetDownloader bug reporting system is live and ready to catch any issues. Thanks for testing it out! 🚀",
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
      console.error("Discord greeting failed:", response.status, response.statusText);
      return res.status(response.status).json({
        error: `Discord API error: ${response.statusText}`,
        success: false,
      });
    }

    res.json({
      success: true,
      message: "Greeting sent to Discord successfully!",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Discord greeting error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send greeting",
      success: false,
    });
  }
};
