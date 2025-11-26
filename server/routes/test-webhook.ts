import { RequestHandler } from "express";

export const handleTestWebhook: RequestHandler = async (req, res) => {
  try {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      return res.status(400).json({
        error: "Discord webhook URL not configured",
        success: false,
      });
    }

    const testEmbed = {
      title: "✅ Webhook Connection Successful",
      description: "The Discord webhook for SunsetDownloader bug reports is working correctly!",
      color: 0xff6b6b,
      fields: [
        {
          name: "Status",
          value: "✅ Connected and Operational",
          inline: true,
        },
        {
          name: "Service",
          value: "SunsetDownloader",
          inline: true,
        },
        {
          name: "Feature",
          value: "Bug Reports & Notifications",
          inline: false,
        },
        {
          name: "Timestamp",
          value: new Date().toISOString(),
          inline: false,
        },
      ],
      footer: {
        text: "Webhook test - All systems operational 🚀",
      },
    };

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "🧪 **SunsetDownloader Webhook Test**",
        embeds: [testEmbed],
      }),
    });

    if (!response.ok) {
      console.error("Discord webhook test failed:", response.status, response.statusText);
      return res.status(response.status).json({
        error: `Discord API error: ${response.statusText}`,
        success: false,
      });
    }

    res.json({
      success: true,
      message: "Test message sent to Discord successfully!",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Webhook test error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to test webhook",
      success: false,
    });
  }
};
