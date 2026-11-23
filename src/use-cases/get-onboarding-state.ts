import { Role } from "@/generated/prisma";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";
import { UserFacade } from "@/features/users/facade";

export type InvalidInvitationReason =
  | "used"
  | "replaced"
  | "revoked"
  | "expired"
  | "notfound"
  | "missing";

export type OnboardingState =
  | { valid: true; email: string; role: Role; name: string | null }
  | { valid: false; reason: InvalidInvitationReason };

// Public, token-bearer flow: invoked from the onboarding page before the
// invitee has an account. Authorization comes from the invitation token, so
// this use-case intentionally does not call any auth guard.
export async function getOnboardingStateUseCase(
  token: string,
): Promise<OnboardingState> {
  const check = await InvitationFacade.getTokenState(token);
  if (check.state === "notfound") {
    return { valid: false, reason: "notfound" };
  }
  if (check.state !== "valid") {
    // Whatever happened to this particular link: if the person already has an
    // account, the only useful answer is "log in".
    if (check.state !== "used" && (await UserFacade.getByEmail(check.email))) {
      return { valid: false, reason: "used" };
    }
    return { valid: false, reason: check.state };
  }

  const { invite } = check;
  if (invite.role === Role.SCHOOL_ASSISTANT) {
    const profile = await SchoolAssistantsFacade.getByEmail(invite.email);
    if (!profile) {
      // The Schulbegleiter entry was deleted after the invitation went out.
      return { valid: false, reason: "revoked" };
    }
    return {
      valid: true,
      email: invite.email,
      role: invite.role,
      name: profile.name,
    };
  }

  return { valid: true, email: invite.email, role: invite.role, name: null };
}
