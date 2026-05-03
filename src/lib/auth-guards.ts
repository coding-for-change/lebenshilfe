import { headers } from "next/headers";
import { auth } from "./auth";
import { isAdmin, isOwner } from "./roles";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Must be logged in.");
  }
  return session.user;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdmin(session.user.role)) {
    throw new Error("Unauthorized: Admin role required.");
  }
  return session.user;
}

export async function requireOwner() {
  const session = await getSession();
  if (!session || !isOwner(session.user.role)) {
    throw new Error("Unauthorized: Owner role required.");
  }
  return session.user;
}
