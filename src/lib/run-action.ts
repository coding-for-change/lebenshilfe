import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "./action-result";
import { isServerActionNotFoundError } from "./deployment-skew";

// Shown for every failure the server did not explain (bugs, database or network
// errors). In production their real message never reaches the browser anyway.
export const GENERIC_ACTION_ERROR =
  "Etwas ist schiefgelaufen. Bitte versuche es erneut. Wenn der Fehler bleibt, wende dich an den Support.";

/**
 * Calls a Server Action wrapped with serverAction() and returns its data, or
 * throws an Error whose message can be shown to the user as is:
 *
 *   const child = await runAction(createChildAction(input));
 *
 * Existing `catch (e) { toast.error(e.message) }` code keeps working. Every
 * call of a Server Action must go through here (checked in CI by
 * scripts/check-action-calls.mjs): a bare `await fooAction()` would ignore a
 * refused request and carry on as if it had succeeded.
 */
export async function runAction<T>(
  pending: Promise<ActionResult<T>>,
): Promise<T> {
  let result: ActionResult<T>;
  try {
    result = await pending;
  } catch (error) {
    // Let Next.js redirects through, and leave stale-deployment errors to
    // DeploymentUpdateNotice, which offers a reload.
    unstable_rethrow(error);
    if (isServerActionNotFoundError(error)) throw error;
    throw new Error(GENERIC_ACTION_ERROR, { cause: error });
  }
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
