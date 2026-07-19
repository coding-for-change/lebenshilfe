import { redirect } from "next/navigation";
import Image from "next/image";

import { getSession, hasPendingTwoFactor } from "@/lib/auth-guards";
import { TwoFactorVerify } from "./two-factor-verify";

export default async function TwoFactorVerifyPage() {
  // A full session means 2FA is already satisfied (or wasn't required) — nothing
  // to verify here, so send the user home.
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  // No full session and no 2FA challenge in flight means the user landed here
  // without signing in. Only a pending challenge should keep this page.
  if (!(await hasPendingTwoFactor())) {
    redirect("/login");
  }

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

      <div className="flex w-full max-w-sm flex-col gap-8">
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

        <TwoFactorVerify />
      </div>
    </div>
  );
}
