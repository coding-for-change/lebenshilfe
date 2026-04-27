"use server";

import { AuthFacade } from "@/features/auth/facade";
import { InvitationFacade } from "@/features/invitations/facade";
import { Role } from "@/generated/prisma";

export async function cancelAdminInvitationUseCase(invitationId: string) {
  await AuthFacade.requireAdmin();

  const invitation = await InvitationFacade.getById(invitationId);
  if (!invitation) {
    throw new Error("Einladung nicht gefunden.");
  }
  if (invitation.role === Role.OWNER) {
    await AuthFacade.requireOwner();
  }

  await InvitationFacade.cancelById(invitationId);
  return { success: true };
}
