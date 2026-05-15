"use server";

import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { UserFacade } from "@/features/users/facade";
import { Role } from "@/generated/prisma";

export async function removeAdminUserUseCase(userId: string) {
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
  return { success: true };
}
