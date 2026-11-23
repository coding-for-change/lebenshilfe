import { unstable_rethrow } from "next/navigation";
import { z, ZodError } from "zod";
import { UserError, type ActionResult } from "./action-result";

// Zod's built-in messages ("Invalid input", "Too small…") in German, for the
// validation errors that reach users through serverAction below.
z.config(z.locales.de());

/**
 * Wraps a Server Action so it returns an ActionResult instead of throwing.
 *
 * - UserError → `{ ok: false, error }` with its message, for the user.
 * - ZodError → `{ ok: false, error }` with the first validation message.
 * - redirect()/notFound() (e.g. from requireAdmin) → rethrown, so Next.js
 *   still performs them.
 * - Anything else → rethrown unchanged. Next.js logs it and the client gets
 *   a generic error, which keeps database details and personal data out of
 *   the browser.
 *
 * Client code calls wrapped actions through runAction() (src/lib/run-action.ts).
 */
export function serverAction<Args extends unknown[], T>(
  action: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<ActionResult<T>> {
  return async (...args: Args) => {
    try {
      return { ok: true, data: await action(...args) };
    } catch (error) {
      unstable_rethrow(error);
      if (error instanceof UserError) {
        return { ok: false, error: error.message };
      }
      if (error instanceof ZodError) {
        return {
          ok: false,
          error: error.issues[0]?.message ?? "Die Eingaben sind ungültig.",
        };
      }
      throw error;
    }
  };
}
