import { CreateInvitationSchema } from "./schemas";
import {
  expireInvitationById,
  expireUnusedInvitationsForEmail,
  findInvitationById,
  findInvitationByToken,
  findNewerInvitationForEmail,
  findOpenInvitationsByEmail,
  listPendingInvitationsByRoles,
  processNewInvitation,
  getAllInvitations as fetchAllInvitations,
} from "./services";
import { Role } from "@/generated/prisma";

type Invitation = NonNullable<
  Awaited<ReturnType<typeof findInvitationByToken>>
>;

export type InvitationTokenState =
  | { state: "valid"; invite: Invitation }
  | { state: "used" | "replaced" | "revoked" | "expired"; email: string }
  | { state: "notfound" };

export const InvitationFacade = {
  // Sends a new invitation. Any other open invitation for this email is closed
  // first: one email has at most one working link, so an old link can never
  // decide the role (e.g. an old Schulbegleiter link after an Admin invite).
  async generateAndSendInvite(
    email: string,
    role: Role = Role.SCHOOL_ASSISTANT,
  ) {
    CreateInvitationSchema.parse({ email, role });
    const replaced = await expireUnusedInvitationsForEmail(email);
    return processNewInvitation(email, role, {
      replacesEarlier: replaced.count > 0,
    });
  },

  // Resends with the role of the invitation being resent. (It used to take the
  // role of the newest invitation for the email, so a resend from the
  // Schulbegleiter list could go out as an Admin invite and vice versa.)
  async regenerateAndSend(email: string, role: Role) {
    CreateInvitationSchema.parse({ email, role });
    await expireUnusedInvitationsForEmail(email);
    return processNewInvitation(email, role, { replacesEarlier: true });
  },

  // What the onboarding page should say about a link. Never throws.
  async getTokenState(token: string): Promise<InvitationTokenState> {
    const invite = await findInvitationByToken(token);
    if (!invite) return { state: "notfound" };
    const { email } = invite;
    if (invite.isUsed) return { state: "used", email };
    if (invite.expiresAt > new Date()) return { state: "valid", invite };

    // Closed links: a resend or a later invitation replaces them, a cancel or
    // deleting the Schulbegleiter withdraws them, otherwise the 7 days ran out.
    const newer = await findNewerInvitationForEmail(email, invite.createdAt);
    if (newer?.isUsed) return { state: "used", email };
    if (newer) return { state: "replaced", email };
    if (invite.expiresAt.getTime() === 0) return { state: "revoked", email };
    return { state: "expired", email };
  },

  async listOpenByEmail(email: string) {
    return findOpenInvitationsByEmail(email);
  },

  // Withdraws every open invitation for this email. Idempotent.
  async cancelOpenForEmail(email: string) {
    await expireUnusedInvitationsForEmail(email);
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
