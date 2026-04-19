import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@/generated/prisma";

export const AuthFacade = {
  async getSession() {
    return auth.api.getSession({ headers: await headers() });
  },

  async requireAdmin() {
    const session = await this.getSession();
    if (!session || session.user.role !== Role.ADMIN) {
      throw new Error("Unauthorized: Admin role required.");
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
