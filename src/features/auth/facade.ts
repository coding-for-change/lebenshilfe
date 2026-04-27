import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAdmin, isOwner } from "@/lib/roles";

export const AuthFacade = {
  async getSession() {
    return auth.api.getSession({ headers: await headers() });
  },

  async requireAdmin() {
    const session = await this.getSession();
    if (!session || !isAdmin(session.user.role)) {
      throw new Error("Unauthorized: Admin role required.");
    }
    return session.user;
  },

  async requireOwner() {
    const session = await this.getSession();
    if (!session || !isOwner(session.user.role)) {
      throw new Error("Unauthorized: Owner role required.");
    }
    return session.user;
  },

  async isAuthenticated() {
    const session = await this.getSession();
    if (!session) {
      throw new Error("Unauthorized: Must be logged in.");
    }
    return session.user;
  },
};
