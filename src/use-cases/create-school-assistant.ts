import { Role } from "@/generated/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";
import type { CreateSchoolAssistantInput } from "@/features/school-assistants/schemas";
import { logBusinessEvent } from "@/lib/logger";

/**
 * An admin creates a new Schulbegleiter:
 * 1. Persist profile + workshop attendances (status = INVITATION_PENDING).
 * 2. Send invitation email so the person can sign up.
 */
export async function createSchoolAssistantUseCase(
  input: CreateSchoolAssistantInput,
) {
  const actor = await requireAdmin();

  await SchoolAssistantsFacade.create(input);
  const invitation = await InvitationFacade.generateAndSendInvite(
    input.email,
    Role.SCHOOL_ASSISTANT,
  );
  // Who invited whom, by reference only (no email/PII).
  logBusinessEvent("USER_INVITED", {
    role: Role.SCHOOL_ASSISTANT,
    invitationId: invitation.id,
    invitedByUserId: actor.id,
  });

  return { success: true };
}
