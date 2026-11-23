import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { UserFacade } from "@/features/users/facade";
import { Role } from "@/generated/prisma";
import { UserError } from "@/lib/action-result";

export async function resetUserTwoFactorUseCase(userId: string) {
  await requireAdmin();

  const target = await UserFacade.getById(userId);
  if (!target) {
    throw new UserError("Benutzer nicht gefunden.");
  }
  // Only an owner may reset an owner's second factor; any admin may reset others'.
  if (target.role === Role.OWNER) {
    await requireOwner();
  }

  await UserFacade.resetTwoFactor(userId);
  return { success: true };
}
