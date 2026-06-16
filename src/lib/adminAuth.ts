import { createHash } from "crypto";

export const ADMIN_COOKIE_NAME = "nextreach_admin";

// Cookie holds a hash of the shared secret rather than the secret itself,
// so it isn't lying around in plaintext in the browser.
export function expectedAdminCookieValue(): string {
  return createHash("sha256").update(process.env.ADMIN_SECRET ?? "").digest("hex");
}
