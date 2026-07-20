import { Role } from "@/generated/prisma";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";

export type OnboardingState =
  | { valid: true; email: string; role: Role; name: string | null }
  | { valid: false; reason: "used" | "expired" | "notfound" };

// Public, token-bearer flow: invoked from the onboarding page before the invitee
// has an account. Authorization comes from the invitation token, so this
// use-case intentionally does not call any auth guard. Unlike the throwing
// verifyToken path, it returns a discriminated status so the page can show a
// precise message (already accepted vs. invalid/expired) and still prefill the
// Schulbegleiter name for a valid invite.
export async function getOnboardingStateUseCase(
  token: string,
): Promise<OnboardingState> {
  const check = await InvitationFacade.getTokenState(token);
  if (check.state !== "valid") {
    return { valid: false, reason: check.state };
  }

  const { invite } = check;
  if (invite.role === Role.SCHOOL_ASSISTANT) {
    const profile = await SchoolAssistantsFacade.getByEmail(invite.email);
    if (!profile) {
      // Invite exists but the pre-seeded profile is gone — treat as invalid.
      return { valid: false, reason: "notfound" };
    }
    return {
      valid: true,
      email: invite.email,
      role: invite.role,
      name: profile.name,
    };
  }

  // Admins/Owners are invited without a pre-seeded profile — they enter their
  // name themselves during onboarding.
  return { valid: true, email: invite.email, role: invite.role, name: null };
}
