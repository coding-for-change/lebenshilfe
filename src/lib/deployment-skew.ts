/**
 * Deployment skew: recovering from stale Server Action IDs.
 *
 * Each Server Action is identified by an action ID baked into the build. A new
 * deployment generates new IDs (Next rotates them at least every 14 days even
 * when the source is unchanged), so a tab still running a previous build can
 * POST an action ID that no longer exists on the server. Next then throws a
 * client-side `UnrecognizedActionError` and the user is stuck until they
 * manually refresh — which is not obvious to them.
 *
 * A full page reload always recovers (it fetches the current build), so we
 * detect this specific error and reload automatically. See
 * node_modules/next/dist/docs/01-app/02-guides/server-actions.md ("Deployment
 * considerations").
 */

// Next tags the thrown error with this stable, non-enumerable code (see
// server-action-reducer.js in the Next runtime). Matching the code first keeps
// detection robust against production message redaction and translation.
const NEXT_ACTION_NOT_FOUND_CODE = "E715";

/**
 * True when `error` is Next's "Server Action was not found on the server"
 * error, i.e. the running tab was built by a previous deployment.
 */
export function isServerActionNotFoundError(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;

  if (
    (error as { __NEXT_ERROR_CODE?: unknown }).__NEXT_ERROR_CODE ===
    NEXT_ACTION_NOT_FOUND_CODE
  ) {
    return true;
  }

  const message = (error as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    (/was not found on the server/i.test(message) ||
      /Failed to find Server Action/i.test(message))
  );
}

// Reload at most once per this window, so a genuinely persistent error (an
// actual bug rather than deployment skew) can't put the tab in a reload loop.
const RELOAD_GUARD_KEY = "deploy-skew-reloaded-at";
const RELOAD_GUARD_WINDOW_MS = 10_000;

/**
 * Reload the page so the tab picks up the current deployment. No-op outside the
 * browser, outside production (never interfere with `next dev`), and if we
 * already reloaded within the guard window.
 */
export function reloadForNewDeployment(): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;

  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY));
    if (last && Date.now() - last < RELOAD_GUARD_WINDOW_MS) return;
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // sessionStorage can throw (private mode, disabled storage). Reloading once
    // is still better than leaving the user stuck, so fall through.
  }

  window.location.reload();
}
