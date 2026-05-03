import { requireAdmin } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchulbegleiterFacade } from "@/features/schulbegleiter/facade";

export async function resendSchulbegleiterInvitationUseCase(profileId: string) {
  await requireAdmin();
  const email = await SchulbegleiterFacade.getEmailForResend(profileId);
  await InvitationFacade.regenerateAndSend(email);
  return { success: true };
}
