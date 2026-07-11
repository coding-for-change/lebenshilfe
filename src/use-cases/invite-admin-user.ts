import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { UserFacade } from "@/features/users/facade";
import {
  InviteAdminUserSchema,
  type InviteAdminUserInput,
} from "@/features/users/schemas";
import { Role } from "@/generated/prisma";
import { logBusinessEvent } from "@/lib/logger";

export async function inviteAdminUserUseCase(input: InviteAdminUserInput) {
  // Anyone with admin or owner access may invite a new ADMIN; only OWNERs may invite a new OWNER.
  const actor = await requireAdmin();

  const parsed = InviteAdminUserSchema.parse(input);

  if (parsed.role === Role.OWNER) {
    await requireOwner();
  }

  const existingUser = await UserFacade.getByEmail(parsed.email);
  if (existingUser) {
    throw new Error("Es existiert bereits ein Benutzer mit dieser E-Mail.");
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
