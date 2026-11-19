import { toConsoleUrls } from "./console-urls.ts";
import type { KolideWebhookPayload, SlackMessage } from "./types.ts";

/**
 * Gets an emoji icon for the event type
 */
function getEventEmoji(eventType: string): string {
  if (eventType.includes("issue")) return "🔴";
  if (eventType.includes("device_trust")) return "🛡️";
  if (eventType.includes("device")) return "💻";
  if (eventType.includes("auth")) return "🔐";
  if (eventType.includes("admin")) return "👤";
  if (eventType.includes("request")) return "📝";
  return "📢";
}

/**
 * Formats the event data fields for display
 */
function formatDataFields(data: Record<string, unknown>): string {
  const fields: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    // Skip null/undefined values
    if (value === null || value === undefined) continue;

    // Format the key (convert snake_case to Title Case)
    const formattedKey = key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Format the value
    let formattedValue: string;
    if (typeof value === "string" && value.startsWith("http")) {
      // Make URLs clickable
      formattedValue = `<${toConsoleUrls(value)}|View>`;
    } else if (typeof value === "object") {
      formattedValue = toConsoleUrls(JSON.stringify(value));
    } else {
      formattedValue = String(value);
    }

    fields.push(`*${formattedKey}:* ${formattedValue}`);
  }

  return fields.join("\n");
}

/**
 * Formats the event title
 */
function formatEventTitle(event: string): string {
  return event
    .split(/[._]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Creates a rich Slack message from a Kolide webhook payload
 */
export function createSlackMessage(
  payload: KolideWebhookPayload,
  linearTicketUrl?: string
): SlackMessage {
  const emoji = getEventEmoji(payload.event);
  const title = formatEventTitle(payload.event);
  const dataFields = formatDataFields(payload.data);
  const timestamp = new Date(payload.timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const blocks: SlackMessage["blocks"] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} ${title}`,
      },
    },
  ];

  // Add Linear ticket link if available
  if (linearTicketUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🎫 *Linear Ticket:* <${linearTicketUrl}|View Ticket>`,
      },
    });
  }

  blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: dataFields || "_No additional data_",
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Event ID: \`${payload.id}\` | Time: ${timestamp}`,
        },
      ],
    }
  );

  return { blocks };
}

/**
 * Sends a message to Slack using an incoming webhook
 */
export async function sendToSlack(webhookUrl: string, message: SlackMessage): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack API error: ${response.status} - ${errorText}`);
  }
}
