"use server";

import { AuthFacade } from "@/features/auth/facade";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchulbegleiterFacade } from "@/features/schulbegleiter/facade";

export async function resendSchulbegleiterInvitationUseCase(profileId: string) {
  await AuthFacade.requireAdmin();
  const email = await SchulbegleiterFacade.getEmailForResend(profileId);
  await InvitationFacade.regenerateAndSend(email);
  return { success: true };
}
