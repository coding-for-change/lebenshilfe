import { Role } from "@/generated/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";
import type { CreateSchoolAssistantInput } from "@/features/school-assistants/schemas";

/**
 * An admin creates a new Schulbegleiter:
 * 1. Persist profile + workshop attendances (status = INVITATION_PENDING).
 * 2. Send invitation email so the person can sign up.
 */
export async function createSchoolAssistantUseCase(
  input: CreateSchoolAssistantInput,
) {
  await requireAdmin();

  await SchoolAssistantsFacade.create(input);
  await InvitationFacade.generateAndSendInvite(
    input.email,
    Role.SCHOOL_ASSISTANT,
  );

  return { success: true };
}
