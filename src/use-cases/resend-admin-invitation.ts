"use server";

import { AuthFacade } from "@/features/auth/facade";
import { InvitationFacade } from "@/features/invitations/facade";
import { Role } from "@/generated/prisma";

export async function resendAdminInvitationUseCase(invitationId: string) {
  await AuthFacade.requireAdmin();

  const invitation = await InvitationFacade.getById(invitationId);
  if (!invitation) {
    throw new Error("Einladung nicht gefunden.");
  }
  if (invitation.role === Role.OWNER) {
    await AuthFacade.requireOwner();
  }

  await InvitationFacade.regenerateAndSend(invitation.email);
  return { success: true };
}
