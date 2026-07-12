import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { isAdmin, isOwner } from "./roles";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
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
