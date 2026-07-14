"use server";

import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { UserFacade } from "@/features/users/facade";
import { Role } from "@/generated/prisma";

export async function resetUserTwoFactorUseCase(userId: string) {
  await requireAdmin();

  const target = await UserFacade.getById(userId);
  if (!target) {
    throw new Error("Benutzer nicht gefunden.");
  }
  // Only an owner may reset an owner's second factor; any admin may reset others'.
  if (target.role === Role.OWNER) {
    await requireOwner();
  }

  await UserFacade.resetTwoFactor(userId);
  return { success: true };
}
