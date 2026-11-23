import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { UserFacade } from "@/features/users/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";
import {
  InviteAdminUserSchema,
  type InviteAdminUserInput,
} from "@/features/users/schemas";
import { Role } from "@/generated/prisma";
import { logBusinessEvent } from "@/lib/logger";
import { UserError } from "@/lib/action-result";

export async function inviteAdminUserUseCase(input: InviteAdminUserInput) {
  // Anyone with admin or owner access may invite a new ADMIN; only OWNERs may invite a new OWNER.
  const actor = await requireAdmin();

  const parsed = InviteAdminUserSchema.parse(input);

  if (parsed.role === Role.OWNER) {
    await requireOwner();
  }

  const existingUser = await UserFacade.getByEmail(parsed.email);
  if (existingUser) {
    throw new UserError("Es existiert bereits ein Benutzer mit dieser E-Mail.");
  }

  // A pending Schulbegleiter entry for the same email would otherwise linger
  // in the Schulbegleiter list next to the new admin. Make the admin decide.
  const pendingProfile = await SchoolAssistantsFacade.getByEmail(parsed.email);
  if (pendingProfile) {
    throw new UserError(
      "Für diese E-Mail gibt es einen offenen Schulbegleiter-Eintrag. Bitte löschen Sie ihn zuerst unter „Schulbegleiter“.",
    );
  }

  const invitation = await InvitationFacade.generateAndSendInvite(
    parsed.email,
    parsed.role,
  );
  // Who invited whom, by reference only (no email/PII): resolve the invitee via
  // invitationId in the DB if needed.
  logBusinessEvent("USER_INVITED", {
    role: parsed.role,
    invitationId: invitation.id,
    invitedByUserId: actor.id,
  });

  return { success: true };
}
