import { Role } from "@/generated/prisma";
import { InvitationFacade } from "@/features/invitations/facade";
import { SchoolAssistantsFacade } from "@/features/school-assistants/facade";

export type OnboardingState =
  | { valid: true; email: string; role: Role; name: string | null }
  | { valid: false; reason: "used" | "expired" | "notfound" };

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
      return { valid: false, reason: "notfound" };
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
