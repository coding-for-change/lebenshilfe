"use server";

import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { UserFacade } from "@/features/users/facade";
import { Role } from "@/generated/prisma";

export async function unlockUserTwoFactorUseCase(userId: string) {
  await requireAdmin();

  const target = await UserFacade.getById(userId);
  if (!target) {
    throw new Error("Benutzer nicht gefunden.");
  }
  // Only an owner may lift an owner's lockout; any admin may unlock others'.
  if (target.role === Role.OWNER) {
    await requireOwner();
  }

  await UserFacade.unlockTwoFactor(userId);
  return { success: true };
}
