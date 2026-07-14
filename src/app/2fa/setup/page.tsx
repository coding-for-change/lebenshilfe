import { redirect } from "next/navigation";
import Image from "next/image";

import { requireAuth } from "@/lib/auth-guards";
import { TwoFactorSetup } from "./two-factor-setup";

export default async function TwoFactorSetupPage() {
  const user = await requireAuth();
  if (user.twoFactorEnabled) {
    redirect("/");
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
        <TwoFactorSetup />
      </div>
    </div>
  );
}
