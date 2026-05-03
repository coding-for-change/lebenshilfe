import { requireAdmin, requireOwner } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { UserFacade } from "@/features/users/facade";
import {
  InviteAdminUserSchema,
  type InviteAdminUserInput,
} from "@/features/users/schemas";
import { Role } from "@/generated/prisma";

export async function inviteAdminUserUseCase(input: InviteAdminUserInput) {
  // Anyone with admin or owner access may invite a new ADMIN; only OWNERs may invite a new OWNER.
  await requireAdmin();

  const parsed = InviteAdminUserSchema.parse(input);

  if (parsed.role === Role.OWNER) {
    await requireOwner();
  }

  const existingUser = await UserFacade.getByEmail(parsed.email);
  if (existingUser) {
    throw new Error("Es existiert bereits ein Benutzer mit dieser E-Mail.");
  }

  await InvitationFacade.generateAndSendInvite(parsed.email, parsed.role);

  return { success: true };
}
