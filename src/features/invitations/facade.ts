import { CreateInvitationSchema } from "./schemas";
import {
  expireInvitationById,
  expireUnusedInvitationsForEmail,
  findInvitationById,
  findInvitationByToken,
  findLatestInvitationByEmail,
  listPendingInvitationsByRoles,
  markInvitationUsed,
  processNewInvitation,
  getAllInvitations as fetchAllInvitations,
} from "./services";
import { Role } from "@/generated/prisma";
import { logBusinessEvent } from "@/lib/logger";

export const InvitationFacade = {
  async generateAndSendInvite(
    email: string,
    role: Role = Role.SCHOOL_ASSISTANT,
  ) {
    CreateInvitationSchema.parse({ email, role });
    logBusinessEvent("USER_INVITED", { role });
    // Token generation, database insertion, and email dispatch are delegated to the service boundary
    return processNewInvitation(email, role);
  },

  async regenerateAndSend(email: string) {
    const latest = await findLatestInvitationByEmail(email);
    const role = latest?.role ?? Role.SCHOOL_ASSISTANT;
    await expireUnusedInvitationsForEmail(email);
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

  async listPendingByRoles(roles: Role[]) {
    return listPendingInvitationsByRoles(roles);
  },

  async getById(id: string) {
    return findInvitationById(id);
  },

  // Cancel a pending invitation by expiring it. Idempotent.
  async cancelById(id: string) {
    const invitation = await findInvitationById(id);
    if (!invitation) {
      throw new Error("Einladung nicht gefunden.");
    }
    if (invitation.isUsed) {
      throw new Error("Eingelöste Einladungen können nicht widerrufen werden.");
    }
    await expireInvitationById(id);
    return invitation;
  },
};
