import { Role } from "@/generated/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";
import { UserFacade } from "@/features/users/facade";
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

  // An email that already has an account (e.g. an admin) can never accept a
  // Schulbegleiter invitation; refuse instead of creating an entry that stays
  // "Einladung ausstehend" forever.
  const email = input.email.trim().toLowerCase();
  if (await UserFacade.getByEmail(email)) {
    throw new Error("Es existiert bereits ein Benutzer mit dieser E-Mail.");
  }
  // Sending this invitation would close an open Admin/Hauptadmin invitation for
  // the same email (one working link per email). Make the admin decide.
  const open = await InvitationFacade.listOpenByEmail(email);
  if (open.some((invite) => invite.role !== Role.SCHOOL_ASSISTANT)) {
    throw new Error(
      "Für diese E-Mail gibt es eine offene Admin-Einladung. Bitte ziehen Sie sie zuerst in der Benutzerverwaltung zurück.",
    );
  }

  await SchoolAssistantsFacade.create(input);
  const invitation = await InvitationFacade.generateAndSendInvite(
    email,
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
