"use server";

import { AuthFacade } from "@/features/auth/facade";
import { InvitationFacade } from "@/features/invitations/facade";
import { UserFacade } from "@/features/users/facade";
import { Role } from "@/generated/prisma";

/**
 * Use Case: An existing admin invites a new member.
 * 1. Verifies caller is Admin.
 * 2. Checks if email is already a registered user.
 * 3. Generates invite token & sends email.
 */
export async function inviteMemberUseCase(
  email: string,
  role: Role = Role.SCHOOL_ASSISTANT,
) {
  // 1. Check if caller is Admin
  await AuthFacade.requireAdmin();

  // 2. Check if user already exists
  const existingUsers = await UserFacade.getSchoolAssistants();
  if (existingUsers.some((u) => u.email === email)) {
    throw new Error("Dieser Benutzer existiert bereits.");
  }

  // 3 & 4. Generate token and send email
  await InvitationFacade.generateAndSendInvite(email, role);

  return { success: true };
}
