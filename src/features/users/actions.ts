"use server";

import { revalidatePath } from "next/cache";
import { inviteAdminUserUseCase } from "@/use-cases/invite-admin-user";
import { promoteUserToOwnerUseCase } from "@/use-cases/promote-user-to-owner";
import { removeAdminUserUseCase } from "@/use-cases/remove-admin-user";
import { resetUserTwoFactorUseCase } from "@/use-cases/reset-user-two-factor";
import { unlockUserTwoFactorUseCase } from "@/use-cases/unlock-user-two-factor";
import { resendAdminInvitationUseCase } from "@/use-cases/resend-admin-invitation";
import { cancelAdminInvitationUseCase } from "@/use-cases/cancel-admin-invitation";
import type { InviteAdminUserInput } from "./schemas";

const ROUTE = "/admin/user-management";

export async function inviteAdminUserAction(input: InviteAdminUserInput) {
  await inviteAdminUserUseCase(input);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function promoteUserToOwnerAction(userId: string) {
  await promoteUserToOwnerUseCase(userId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function removeAdminUserAction(userId: string) {
  await removeAdminUserUseCase(userId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function resetUserTwoFactorAction(userId: string) {
  await resetUserTwoFactorUseCase(userId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function unlockUserTwoFactorAction(userId: string) {
  await unlockUserTwoFactorUseCase(userId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function resendAdminInvitationAction(invitationId: string) {
  await resendAdminInvitationUseCase(invitationId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function cancelAdminInvitationAction(invitationId: string) {
  await cancelAdminInvitationUseCase(invitationId);
  revalidatePath(ROUTE);
  return { success: true };
}
