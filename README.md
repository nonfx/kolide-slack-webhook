# Kolide Slack Webhook

A Cloudflare Worker that receives webhook events from Kolide and forwards them to Slack with rich formatting.

## Features

- Receives all Kolide webhook events (device trust changes, issues, authentication, etc.)
- Verifies webhook signatures using SHA256 HMAC
- Sends beautifully formatted messages to Slack using Block Kit
- Runs on Cloudflare Workers (serverless, globally distributed)
- Built with Bun and TypeScript

## Prerequisites

- [Bun](https://bun.sh) runtime installed
- [1Password CLI (`op`)](https://developer.1password.com/docs/cli/get-started/) for secrets management
- Cloudflare account with Workers enabled
- Kolide account with admin access
- Slack workspace with webhook permissions

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Slack Incoming Webhook

1. Go to your Slack workspace settings
2. Navigate to "Apps" → "Manage" → "Custom Integrations" → "Incoming Webhooks"
3. Click "Add to Slack"
4. Choose the channel where you want Kolide events posted
5. Copy the webhook URL (it looks like `https://hooks.slack.com/services/...`)
6. Store it in 1Password

### 3. Configure Kolide Webhook

1. Log into Kolide as an admin
2. Go to Settings → Developers → Webhooks
3. Click "Add Endpoint"
4. You'll get a signing secret - store this in 1Password
5. After deploying (step 5), come back and enter your worker URL

### 4. Set Up Secrets

Store your secrets in 1Password with `op://` references, then run:

```bash
bun run setup-secrets
```

This script will:
- Prompt you for your 1Password item references
- Fetch the secrets using `op` CLI
- Configure them in Cloudflare Workers

Required secrets:
- `KOLIDE_WEBHOOK_SECRET`: The signing secret from Kolide webhook settings
- `SLACK_WEBHOOK_URL`: Your Slack incoming webhook URL

### 5. Deploy to Cloudflare Workers

First, authenticate with Cloudflare:

```bash
bunx wrangler login
```

Then deploy:

```bash
bun run deploy
```

After deployment, you'll get a worker URL like `https://kolide-slack-webhook.your-subdomain.workers.dev`

### 6. Configure Kolide Webhook URL

Go back to Kolide webhook settings and enter your worker URL.

## Development

### Local Development

Run the worker locally:

```bash
bun run dev
```

This starts a local development server. You can test it with curl:

```bash
# You'll need to generate a valid HMAC signature for testing
curl -X POST http://localhost:8787 \\
  -H "Authorization: YOUR_SIGNATURE" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"issues.new","id":"test-123","timestamp":"2024-01-01T00:00:00Z","data":{"issue":"Test"}}'
```

### View Logs

To see real-time logs from your deployed worker:

```bash
bun run tail
```

### Type Checking

Run TypeScript type checking:

```bash
bun run type-check
```

## Project Structure

```
.
├── src/
│   ├── index.ts      # Main Cloudflare Worker handler
│   ├── types.ts      # TypeScript type definitions
│   ├── verify.ts     # Webhook signature verification
│   └── slack.ts      # Slack message formatting
├── wrangler.toml     # Cloudflare Workers configuration
├── package.json      # Dependencies and scripts
└── setup-secrets.sh  # Secret management script
```

## Supported Kolide Events

The webhook handles all Kolide event types:

- `audit_log.recorded` - Admin/system actions
- `admin_users.created` - New admin users
- `auth_logs.success` / `auth_logs.failure` - Authentication events
- `devices.created` / `devices.registered` / `devices.destroyed` - Device lifecycle
- `device_trust.status_changed` - Device trust status changes
- `issues.new` / `issues.resolved` - Compliance issues
- `requests.issue_exemption` / `requests.registration` - User requests

Each event is formatted with appropriate emojis and colors in Slack.

## Security

- Webhook signatures are verified using SHA256 HMAC
- Secrets are stored securely in Cloudflare Workers environment
- No secrets are committed to version control
- Invalid signatures return 401 Unauthorized

## Troubleshooting

### Webhook verification fails

- Ensure `KOLIDE_WEBHOOK_SECRET` matches the secret from Kolide exactly
- Check that the request body is being read as raw text before verification

### Messages not appearing in Slack

- Verify `SLACK_WEBHOOK_URL` is correct
- Check the Slack channel permissions
- Use `bun run tail` to see error logs

### Deployment issues

- Ensure you're logged into Cloudflare: `bunx wrangler login`
- Check that your Cloudflare account has Workers enabled
- Verify secrets are set: `bunx wrangler secret list`

## License

MIT
