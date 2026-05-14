import { requireAdmin } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";

export async function resendSchoolAssistantInvitationUseCase(
  profileId: string,
) {
  await requireAdmin();
  const email = await SchoolAssistantsFacade.getEmailForResend(profileId);
  await InvitationFacade.regenerateAndSend(email);
  return { success: true };
}
