"use server";

import { requireOwner } from "@/lib/auth-guards";
import { UserFacade } from "@/features/users/facade";

export async function promoteUserToOwnerUseCase(userId: string) {
  await requireOwner();
  await UserFacade.promoteToOwner(userId);
  return { success: true };
}
