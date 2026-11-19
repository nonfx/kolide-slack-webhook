// Kolide webhook payloads link to api.kolide.com, which needs an API key and
// fails when opened in a browser. Device and person URLs have a console page at
// the same path under app.kolide.com/x/ (x resolves to the signed-in user's
// organization). Auth log URLs have no console page at that path (404), and
// issue and admin user paths are unverified, so those stay as Kolide sent them.
const CONSOLE_PATHS = /https:\/\/api\.kolide\.com\/(devices|people)\//g;

/**
 * Rewrites Kolide API URLs in text to their web console pages where one exists
 */
export function toConsoleUrls(text: string): string {
  return text.replace(CONSOLE_PATHS, "https://app.kolide.com/x/$1/");
}
