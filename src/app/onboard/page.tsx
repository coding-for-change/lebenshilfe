import Image from "next/image";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth-guards";
import { getOnboardingStateUseCase } from "@/use-cases/get-onboarding-state";
import { OnboardForm } from "@/features/invitations/components/onboard-form";
import { InvalidInvitationCard } from "@/features/invitations/components/invalid-invitation-card";

export default async function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // A logged-in visitor has no use for the sign-up flow — the invitation
  // (whether valid or already accepted) is irrelevant once you have an account.
  // Send them straight to their start page; the root route dispatches by role
  // (Schulbegleiter → home, Admin/Owner → /admin). This is the common case
  // behind "I already accepted my invite but reopened the link".
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const { token } = await searchParams;
  const state = token
    ? await getOnboardingStateUseCase(token)
    : { valid: false as const, reason: "missing" as const };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/login.webp')" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-black/30"
      />

      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex justify-center">
          <Image
            src="/lebenshilfe-muenchen-logo_2026.svg"
            alt="Lebenshilfe München"
            width={220}
            height={64}
            priority
            className="h-14 w-auto drop-shadow-lg"
          />
        </div>

        {state.valid ? (
          <OnboardForm
            token={token!}
            email={state.email}
            name={state.name}
          />
        ) : (
          <InvalidInvitationCard reason={state.reason} />
        )}
      </div>
    </div>
  );
}
