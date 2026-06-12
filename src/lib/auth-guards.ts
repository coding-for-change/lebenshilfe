import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { isAdmin, isOwner } from "./roles";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
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
  return session.user;
}
