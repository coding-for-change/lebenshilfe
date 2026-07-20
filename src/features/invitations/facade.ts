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

export const InvitationFacade = {
  async generateAndSendInvite(
    email: string,
    role: Role = Role.SCHOOL_ASSISTANT,
  ) {
    CreateInvitationSchema.parse({ email, role });
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

  // Non-throwing counterpart of verifyToken: returns a discriminated status so
  // callers can tell an already-accepted invite apart from an invalid/expired
  // one (verifyToken collapses all of these into a single thrown error).
  async getTokenState(token: string) {
    const invite = await findInvitationByToken(token);
    if (!invite) return { state: "notfound" as const };
    if (invite.isUsed) return { state: "used" as const };
    if (invite.expiresAt < new Date()) return { state: "expired" as const };
    return { state: "valid" as const, invite };
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
