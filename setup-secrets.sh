#!/bin/bash
set -e

echo "🔐 Setting up Cloudflare Worker secrets from 1Password..."
echo ""

# Check if op CLI is installed
if ! command -v op &> /dev/null; then
    echo "❌ Error: 1Password CLI (op) is not installed"
    echo "Install it from: https://developer.1password.com/docs/cli/get-started/"
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI is not installed"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

echo "📝 Please provide the 1Password item references for your secrets:"
echo ""

# Prompt for the 1Password references
read -p "Enter the op:// reference for KOLIDE_WEBHOOK_SECRET: " KOLIDE_SECRET_REF
read -p "Enter the op:// reference for SLACK_WEBHOOK_URL: " SLACK_URL_REF

echo ""
echo "🔄 Fetching secrets from 1Password..."

# Fetch the secrets using op CLI
KOLIDE_SECRET=$(op read "$KOLIDE_SECRET_REF")
SLACK_URL=$(op read "$SLACK_URL_REF")

# Check if secrets were fetched successfully
if [ -z "$KOLIDE_SECRET" ] || [ -z "$SLACK_URL" ]; then
    echo "❌ Error: Failed to fetch secrets from 1Password"
    exit 1
fi

echo "✅ Secrets fetched successfully"
echo ""
echo "🚀 Setting secrets in Cloudflare Workers..."

# Set the secrets using wrangler
echo "$KOLIDE_SECRET" | wrangler secret put KOLIDE_WEBHOOK_SECRET
echo "$SLACK_URL" | wrangler secret put SLACK_WEBHOOK_URL

echo ""
echo "✅ All secrets have been configured!"
echo ""
echo "You can now deploy your worker with: bun run deploy"
