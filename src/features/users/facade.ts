import {
  getUserByEmail,
  findUserById,
  createUser,
  deleteUserById,
  deleteUserWithLastOwnerGuard,
  getAllSchoolAssistants,
  listAdminUsers,
  countOwners,
  updateUserRole,
  resetUserTwoFactor,
  clearUnverifiedTwoFactor,
  unlockUserTwoFactor,
} from "./services";
import { Role } from "@/generated/prisma";

export const UserFacade = {
  async ensureUserExistsAndProvision(email: string, role: Role, name: string) {
    const existing = await getUserByEmail(email);
    if (existing) {
      return existing;
    }
    return createUser(email, name, role);
  },

  async getSchoolAssistants() {
    return getAllSchoolAssistants();
  },

  async deleteUser(targetId: string) {
    return deleteUserById(targetId);
  },

  // ----- User-management surface (Admin & Owner) -----

  async listAdminUsers() {
    return listAdminUsers();
  },

  async countOwners() {
    return countOwners();
  },

  async getById(id: string) {
    return findUserById(id);
  },

  async getByEmail(email: string) {
    return getUserByEmail(email);
  },

  async promoteToOwner(userId: string) {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("Benutzer nicht gefunden.");
    }
    if (user.role === Role.OWNER) {
      return user;
    }
    if (user.role !== Role.ADMIN) {
      throw new Error("Nur Admins können zum Owner befördert werden.");
    }
    return updateUserRole(userId, Role.OWNER);
  },

  // Removes a user, enforcing the "always at least one owner" invariant atomically.
  async removeUser(userId: string) {
    return deleteUserWithLastOwnerGuard(userId);
  },

  async resetTwoFactor(userId: string) {
    return resetUserTwoFactor(userId);
  },

  // Self-service cleanup before a fresh 2FA enrollment: removes a stale row left
  // by an interrupted setup so better-auth's enable() starts from a clean slate.
  async clearUnverifiedTwoFactor(userId: string) {
    return clearUnverifiedTwoFactor(userId);
  },

  async unlockTwoFactor(userId: string) {
    return unlockUserTwoFactor(userId);
  },
};
