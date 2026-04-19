import { CreateInvitationSchema } from "./schemas";
import {
  findInvitationByToken,
  markInvitationUsed,
  processNewInvitation,
  getAllInvitations as fetchAllInvitations,
} from "./services";
import { Role } from "@/generated/prisma";

export const InvitationFacade = {
  async generateAndSendInvite(
    email: string,
    role: Role = Role.SCHOOL_ASSISTANT,
  ) {
    CreateInvitationSchema.parse({ email, role });
    // Token generation, database insertion, and email dispatch are delegated to the service boundary
    return processNewInvitation(email, role);
  },

  async verifyToken(token: string) {
    const invite = await findInvitationByToken(token);
    if (!invite || invite.isUsed || invite.expiresAt < new Date()) {
      throw new Error("Ungültiges oder abgelaufenes Einladungstoken.");
    }
    return invite;
  },

  async consumeToken(id: string) {
    await markInvitationUsed(id);
  },

  async getAllInvitations() {
    return fetchAllInvitations();
  },
};
