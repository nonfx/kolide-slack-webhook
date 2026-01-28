import type { KolideWebhookPayload } from "./types.ts";

/**
 * Response from Linear's issue creation API
 */
export interface LinearIssueResponse {
  success: boolean;
  issue: {
    id: string;
    identifier: string; // e.g., "ENG-123"
    title: string;
    url: string;
  };
}

/**
 * Extracts device or user information from Kolide payload
 */
function extractDeviceUserInfo(data: Record<string, unknown>): string {
  // Try to find device or user information
  const deviceName = data.device_name || data.device || data.hostname;
  const userName = data.user_name || data.user || data.email;
  const issueName = data.issue_name || data.title || data.name;

  const parts: string[] = [];
  if (issueName) parts.push(String(issueName));
  if (deviceName) parts.push(`Device: ${deviceName}`);
  if (userName) parts.push(`User: ${userName}`);

  return parts.length > 0 ? parts.join(" - ") : "";
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
 * Creates a ticket title from the Kolide payload
 */
function createTicketTitle(payload: KolideWebhookPayload): string {
  const eventTitle = formatEventTitle(payload.event);
  const deviceUserInfo = extractDeviceUserInfo(payload.data);

  if (deviceUserInfo) {
    return `${eventTitle} - ${deviceUserInfo}`;
  }

  return `${eventTitle} - ${new Date(payload.timestamp).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  })}`;
}

/**
 * Creates a description for the Linear ticket
 */
function createTicketDescription(payload: KolideWebhookPayload): string {
  const lines: string[] = [
    `# Kolide Event: ${payload.event}`,
    "",
    `**Event ID:** ${payload.id}`,
    `**Timestamp:** ${new Date(payload.timestamp).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    })}`,
    "",
    "## Event Data",
    "",
  ];

  // Add all data fields
  for (const [key, value] of Object.entries(payload.data)) {
    if (value === null || value === undefined) continue;

    const formattedKey = key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    if (typeof value === "object") {
      lines.push(`**${formattedKey}:**`);
      lines.push("```json");
      lines.push(JSON.stringify(value, null, 2));
      lines.push("```");
    } else {
      lines.push(`**${formattedKey}:** ${value}`);
    }
  }

  return lines.join("\n");
}

/**
 * Creates a Linear ticket via their GraphQL API
 */
export async function createLinearTicket(
  apiKey: string,
  teamId: string,
  payload: KolideWebhookPayload
): Promise<LinearIssueResponse> {
  const title = createTicketTitle(payload);
  const description = createTicketDescription(payload);

  // Linear uses GraphQL API
  const mutation = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;

  const variables = {
    input: {
      teamId: teamId,
      title: title,
      description: description,
      priority: 2, // Medium priority (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low)
    },
  };

  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Linear API error: ${response.status} - ${errorText}`);
  }

  const result = (await response.json()) as {
    data?: { issueCreate: LinearIssueResponse };
    errors?: Array<{ message: string }>;
  };

  if (result.errors) {
    throw new Error(`Linear GraphQL error: ${JSON.stringify(result.errors)}`);
  }

  if (!result.data?.issueCreate?.success) {
    throw new Error("Linear ticket creation failed");
  }

  return result.data.issueCreate;
}

/**
 * Checks if an event should trigger Linear ticket creation
 */
export function shouldCreateLinearTicket(eventType: string): boolean {
  const ticketEvents = ["issues.new", "requests.issue_exemption", "requests.registration"];
  return ticketEvents.includes(eventType);
}
