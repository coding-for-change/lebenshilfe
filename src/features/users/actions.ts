"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@/generated/prisma";
import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { UserFacade } from "./facade";
import { InvitationFacade } from "@/features/invitations/facade";
import { inviteAdminUserUseCase } from "@/use-cases/invite-admin-user";
import type { InviteAdminUserInput } from "./schemas";

const ROUTE = "/admin/user-management";

export async function inviteAdminUserAction(input: InviteAdminUserInput) {
  await inviteAdminUserUseCase(input);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function promoteUserToOwnerAction(userId: string) {
  await requireOwner();
  await UserFacade.promoteToOwner(userId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function removeAdminUserAction(userId: string) {
  const actor = await requireAdmin();

  if (actor.id === userId) {
    throw new Error("Du kannst dich nicht selbst entfernen.");
  }

  const target = await UserFacade.getById(userId);
  if (!target) {
    throw new Error("Benutzer nicht gefunden.");
  }
  if (target.role === Role.SCHOOL_ASSISTANT) {
    throw new Error(
      "Schulbegleiter können hier nicht entfernt werden. Bitte über die Schulbegleiter-Verwaltung.",
    );
  }
  if (target.role === Role.OWNER) {
    await requireOwner();
  }

  // The facade enforces the "always at least one owner" invariant inside a transaction.
  await UserFacade.removeUser(userId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function resendAdminInvitationAction(invitationId: string) {
  await requireAdmin();
  const invitation = await InvitationFacade.getById(invitationId);
  if (!invitation) {
    throw new Error("Einladung nicht gefunden.");
  }
  if (invitation.role === Role.OWNER) {
    await requireOwner();
  }
  await InvitationFacade.regenerateAndSend(invitation.email);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function cancelAdminInvitationAction(invitationId: string) {
  await requireAdmin();
  const invitation = await InvitationFacade.getById(invitationId);
  if (!invitation) {
    throw new Error("Einladung nicht gefunden.");
  }
  if (invitation.role === Role.OWNER) {
    await requireOwner();
  }
  await InvitationFacade.cancelById(invitationId);
  revalidatePath(ROUTE);
  return { success: true };
}
