import {
  getUserByEmail,
  createUser,
  deleteUserById,
  getAllSchoolAssistants,
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
};
