import { requireAdmin } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";
import { logBusinessEvent } from "@/lib/logger";

/**
 * An admin deletes a Schulbegleiter entry. Also withdraws any open invitation
 * for that email: otherwise the link in the invitation email would still work
 * and create an account for a Schulbegleiter who no longer exists.
 */
export async function deleteSchoolAssistantUseCase(profileId: string) {
  const actor = await requireAdmin();

  const profile = await SchoolAssistantsFacade.getById(profileId);
  if (!profile) {
    throw new Error("Schulbegleiter nicht gefunden.");
  }

  await SchoolAssistantsFacade.delete(profileId);
  await InvitationFacade.cancelOpenForEmail(profile.email);
  logBusinessEvent("SCHOOL_ASSISTANT_DELETED", {
    profileId,
    deletedByUserId: actor.id,
  });

  return { success: true };
}
