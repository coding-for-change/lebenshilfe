import { Role } from "@/generated/prisma";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";

// Public, token-bearer flow: invoked from the onboarding page before the
// invitee has an account. Authorization comes from the invitation token, so
// this use-case intentionally does not call any auth guard.
export async function fetchInviteDetailsUseCase(token: string) {
  const invite = await InvitationFacade.verifyToken(token);

  if (invite.role === Role.SCHOOL_ASSISTANT) {
    const profile = await SchoolAssistantsFacade.getByEmail(invite.email);
    if (!profile) {
      throw new Error(
        "Kein Schulbegleiter-Profil für diese Einladung gefunden.",
      );
    }
    return { email: invite.email, role: invite.role, name: profile.name };
  }

  // Admins/Owners are invited without a pre-seeded profile — they enter
  // their name themselves during onboarding.
  return { email: invite.email, role: invite.role, name: null };
}
