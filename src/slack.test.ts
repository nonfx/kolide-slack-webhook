/// <reference types="bun" />
import { expect, test } from "bun:test";
import { createSlackMessage } from "./slack.ts";
import type { KolideWebhookPayload } from "./types.ts";

function sectionText(payload: KolideWebhookPayload): string {
  return createSlackMessage(payload)
    .blocks.filter((block) => block.type === "section")
    .map((block) => block.text?.text ?? "")
    .join("\n");
}

test("device and owner links open the Kolide console", () => {
  const text = sectionText({
    event: "devices.registered",
    id: "01KEXTC6SR2BRSAAMDB167S7P4",
    timestamp: "2026-01-14T08:36:00Z",
    data: {
      device_id: 985671,
      device_url: "https://api.kolide.com/devices/985671",
      description: "Registered https://api.kolide.com/devices/985671",
      registered_owner: { id: 764854, owner_url: "https://api.kolide.com/people/764854" },
    },
  });

  expect(text).toContain("<https://app.kolide.com/x/devices/985671|View>");
  expect(text).toContain('"owner_url":"https://app.kolide.com/x/people/764854"');
  expect(text).not.toContain("api.kolide.com");
});

test("auth log links have no console page and stay as sent", () => {
  const text = sectionText({
    event: "auth_logs.success",
    id: "01KG42RRQ1RQRHVBV950V9H4EZ",
    timestamp: "2026-01-29T05:14:00Z",
    data: {
      auth_log_url: "https://api.kolide.com/auth_logs/e7beb465-500f-4463-a062-c4dce7f18420",
    },
  });

  expect(text).toContain(
    "<https://api.kolide.com/auth_logs/e7beb465-500f-4463-a062-c4dce7f18420|View>",
  );
});
