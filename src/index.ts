import type { Env, KolideWebhookPayload } from "./types.ts";
import { verifyKolideSignature } from "./verify.ts";
import { createSlackMessage, sendToSlack } from "./slack.ts";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Get the signature from the Authorization header
      const signature = request.headers.get("Authorization");
      if (!signature) {
        return new Response("Missing Authorization header", { status: 401 });
      }

      // Get the webhook identifier (optional, but good for logging)
      const webhookIdentifier = request.headers.get("X-Kolide-Webhook-Identifier");

      // Read the request body
      const bodyText = await request.text();

      // Verify the signature
      const isValid = await verifyKolideSignature(
        bodyText,
        signature,
        env.KOLIDE_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.error("Invalid signature received");
        return new Response("Invalid signature", { status: 401 });
      }

      // Parse the webhook payload
      let payload: KolideWebhookPayload;
      try {
        payload = JSON.parse(bodyText);
      } catch (error) {
        console.error("Failed to parse JSON payload:", error);
        return new Response("Invalid JSON payload", { status: 400 });
      }

      // Validate payload structure
      if (!payload.event || !payload.id || !payload.timestamp) {
        console.error("Invalid payload structure:", payload);
        return new Response("Invalid payload structure", { status: 400 });
      }

      // Log the event for debugging
      console.log(`Received Kolide event: ${payload.event} (${payload.id})`);

      // Create and send Slack message
      const slackMessage = createSlackMessage(payload);
      await sendToSlack(env.SLACK_WEBHOOK_URL, slackMessage);

      console.log(`Successfully forwarded event ${payload.id} to Slack`);

      // Return success response
      return new Response("Event processed successfully", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } catch (error) {
      console.error("Error processing webhook:", error);

      // Don't expose internal errors to the caller
      return new Response("Internal server error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
