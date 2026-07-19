import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { isAdmin, isOwner } from "./roles";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

// True while a 2FA challenge is in flight. When a user with 2FA enabled signs in
// with the correct password, better-auth deletes the full session cookie and sets
// a short-lived signed `two_factor` cookie instead (see the twoFactor plugin), so
// `getSession()` returns null even though the user is mid-login. The verify page
// (/2fa) uses this to tell a legitimate pending challenge apart from someone who
// is simply not signed in. We derive the exact cookie name (incl. the __Secure-
// prefix in production) from better-auth's own cookie helper rather than
// hardcoding it. Mere presence is enough for a UI-level redirect; the verify
// endpoint still validates the signed cookie and its DB verification value.
export async function hasPendingTwoFactor() {
  const ctx = await auth.$context;
  const { name } = ctx.createAuthCookie("two_factor");
  const cookieStore = await cookies();
  return cookieStore.has(name);
}

// Admin/owner accounts guard special-category data, so a second factor is
// mandatory. better-auth issues a full session to accounts that haven't enrolled
// yet (it only gates login once 2FA exists), so first-time enrollment is forced
// here as well as in the app-wide gate (src/proxy.ts). This stays server-side
// because Next.js proxy must not be the sole authz for Server Actions.
function requireTwoFactorEnrolled(user: { twoFactorEnabled?: boolean | null }) {
  if (!user.twoFactorEnabled) {
    redirect("/2fa/setup");
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Bitte melde dich an."));
  }
  return session.user;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Bitte melde dich an."));
  }
  if (!isAdmin(session.user.role)) {
    redirect(
      "/login?error=" + encodeURIComponent("Admin-Rechte erforderlich."),
    );
  }
  requireTwoFactorEnrolled(session.user);
  return session.user;
}

export async function requireOwner() {
  const session = await getSession();
  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Bitte melde dich an."));
  }
  if (!isOwner(session.user.role)) {
    redirect(
      "/login?error=" + encodeURIComponent("Inhaber-Rechte erforderlich."),
    );
  }
  requireTwoFactorEnrolled(session.user);
  return session.user;
}
