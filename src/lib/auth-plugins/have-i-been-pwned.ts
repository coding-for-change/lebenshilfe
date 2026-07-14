import type { BetterAuthPlugin } from "better-auth";
import type { AuthContext } from "@better-auth/core";
import { APIError, isAPIError } from "better-auth/api";
import { createHash } from "node:crypto";
import { logger } from "@/lib/logger";

// How long to wait for the HIBP range API before giving up. The breach check
// runs inline on the password-set request, so a hung upstream must not stall
// the user — bail out and fail open instead.
const HIBP_TIMEOUT_MS = 3000;

const DEFAULT_COMPROMISED_MESSAGE =
  "The password you entered has been compromised. Please choose a different password.";

interface HaveIBeenPwnedOptions {
  customPasswordCompromisedMessage?: string;
}

/**
 * Queries the HaveIBeenPwned range API using k-anonymity: only the first 5
 * characters of the password's SHA-1 hash leave the server. Returns `true`
 * only when the full suffix is present in the response (i.e. the password is
 * confirmed breached). Throws on any transport/HTTP/timeout failure so the
 * caller can distinguish "confirmed breached" from "could not check".
 */
async function isPasswordBreached(password: string): Promise<boolean> {
  const sha1Hash = createHash("sha1")
    .update(password)
    .digest("hex")
    .toUpperCase();
  const prefix = sha1Hash.slice(0, 5);
  const suffix = sha1Hash.slice(5);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "Add-Padding": "true",
          "User-Agent": "BetterAuth Password Checker",
        },
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      throw new Error(`HIBP responded with status ${response.status}`);
    }
    const body = await response.text();
    return body
      .split("\n")
      .some((line) => line.split(":")[0]?.trim().toUpperCase() === suffix);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Drop-in replacement for better-auth's built-in `haveIBeenPwned` plugin that
 * **fails open**. The built-in throws `INTERNAL_SERVER_ERROR` (→ HTTP 500)
 * whenever the pwnedpasswords.com request fails, which turns a transient
 * outage of that external, best-effort service into hard breakage of password
 * reset, invitation sign-up and password change. (api.pwnedpasswords.com is
 * Cloudflare-fronted and does intermittently return TLS errors from this host.)
 *
 * Here a confirmed breach still blocks the password, but any inability to
 * reach the service is logged and the password is allowed through. The breach
 * check is defence-in-depth on top of the 12-char minimum length — it must not
 * become a single point of failure that locks admins out of their own reset
 * flow.
 */
export const haveIBeenPwned = (
  options?: HaveIBeenPwnedOptions,
): BetterAuthPlugin => {
  const compromisedMessage =
    options?.customPasswordCompromisedMessage ?? DEFAULT_COMPROMISED_MESSAGE;

  return {
    id: "have-i-been-pwned",
    init(ctx: AuthContext) {
      const originalHash = ctx.password.hash;
      return {
        context: {
          password: {
            ...ctx.password,
            async hash(password: string) {
              try {
                if (await isPasswordBreached(password)) {
                  throw APIError.from("BAD_REQUEST", {
                    message: compromisedMessage,
                    code: "PASSWORD_COMPROMISED",
                  });
                }
              } catch (error) {
                // A confirmed-breach rejection is an APIError we raised above —
                // re-throw it so the password is still blocked.
                if (isAPIError(error)) throw error;
                // Anything else is a transport/HTTP/timeout failure of the
                // breach service. Fail open: log for audit and let the password
                // through (the minimum-length policy still applies).
                logger.warn(
                  { err: error },
                  "[auth] HIBP breach check unavailable — allowing password (fail-open)",
                );
              }
              return originalHash(password);
            },
          },
        },
      };
    },
  };
};
