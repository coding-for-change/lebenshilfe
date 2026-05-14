"use server";

import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { Role } from "@/generated/prisma";

export async function cancelAdminInvitationUseCase(invitationId: string) {
  await requireAdmin();

  const invitation = await InvitationFacade.getById(invitationId);
  if (!invitation) {
    throw new Error("Einladung nicht gefunden.");
  }
  if (invitation.role === Role.OWNER) {
    await requireOwner();
  }

  await InvitationFacade.cancelById(invitationId);
  return { success: true };
}
