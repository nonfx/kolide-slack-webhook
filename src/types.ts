// Kolide webhook event types
export type KolideEventType =
  | "audit_log.recorded"
  | "admin_users.created"
  | "auth_logs.success"
  | "auth_logs.failure"
  | "devices.created"
  | "devices.registered"
  | "devices.destroyed"
  | "device_trust.status_changed"
  | "issues.new"
  | "issues.resolved"
  | "requests.issue_exemption"
  | "requests.registration";

// Base webhook payload structure
export interface KolideWebhookPayload {
  event: KolideEventType;
  id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// Environment bindings for Cloudflare Workers
export interface Env {
  KOLIDE_WEBHOOK_SECRET: string;
  SLACK_WEBHOOK_URL: string;
}

// Slack message block types
export interface SlackMessage {
  blocks: Array<SlackBlock>;
}

export type SlackBlock =
  | {
      type: "header";
      text: {
        type: "plain_text";
        text: string;
      };
    }
  | {
      type: "section";
      text: {
        type: "mrkdwn";
        text: string;
      };
    }
  | {
      type: "context";
      elements: Array<{
        type: "mrkdwn";
        text: string;
      }>;
    };
