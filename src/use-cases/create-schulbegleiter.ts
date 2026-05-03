import { Role } from "@/generated/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchulbegleiterFacade } from "@/features/schulbegleiter/facade";
import type { CreateSchulbegleiterInput } from "@/features/schulbegleiter/schemas";

/**
 * An admin creates a new Schulbegleiter:
 * 1. Persist profile + workshop attendances (status = INVITATION_PENDING).
 * 2. Send invitation email so the person can sign up.
 */
export async function createSchulbegleiterUseCase(
  input: CreateSchulbegleiterInput,
) {
  await requireAdmin();

  await SchulbegleiterFacade.create(input);
  await InvitationFacade.generateAndSendInvite(
    input.email,
    Role.SCHOOL_ASSISTANT,
  );

  return { success: true };
}
