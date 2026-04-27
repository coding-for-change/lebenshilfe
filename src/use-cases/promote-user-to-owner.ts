"use server";

import { AuthFacade } from "@/features/auth/facade";
import { UserFacade } from "@/features/users/facade";

export async function promoteUserToOwnerUseCase(userId: string) {
  await AuthFacade.requireOwner();
  await UserFacade.promoteToOwner(userId);
  return { success: true };
}
