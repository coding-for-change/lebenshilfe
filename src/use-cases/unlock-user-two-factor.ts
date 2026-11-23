import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { UserFacade } from "@/features/users/facade";
import { Role } from "@/generated/prisma";
import { UserError } from "@/lib/action-result";

export async function unlockUserTwoFactorUseCase(userId: string) {
  await requireAdmin();

  const target = await UserFacade.getById(userId);
  if (!target) {
    throw new UserError("Benutzer nicht gefunden.");
  }
  // Only an owner may lift an owner's lockout; any admin may unlock others'.
  if (target.role === Role.OWNER) {
    await requireOwner();
  }

  await UserFacade.unlockTwoFactor(userId);
  return { success: true };
}
