"use server";

import { requireAuth } from "@/lib/auth-guards";
import { UserFacade } from "@/features/users";

// Called by the setup form right before better-auth's twoFactor.enable(). If an
// earlier enrollment was interrupted, a stale two_factor row lingers and enable()
// would inherit its `verified` flag onto the new secret, making every code read
// as invalid. Clearing it first keeps 2FA setup self-healing — no admin reset
// needed. No-op once 2FA is actually enabled (see facade/service guard).
export async function prepareTwoFactorSetupAction() {
  const user = await requireAuth();
  await UserFacade.clearUnverifiedTwoFactor(user.id);
  return { success: true };
}
