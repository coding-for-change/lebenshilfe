"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/auth-client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    // Always show success to prevent email enumeration
    await requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    }).catch(() => {});

    setStatus("sent");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-border p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Passwort vergessen
          </h1>
          <p className="text-sm text-muted-foreground">
            Gib deine E-Mail-Adresse ein und wir senden dir einen Reset-Link.
          </p>
        </div>

        {status === "sent" ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 text-center">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Falls diese E-Mail-Adresse bei uns registriert ist, hast du
                soeben einen Reset-Link erhalten.
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Bitte überprüfe auch deinen Spam-Ordner.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Input
              type="email"
              placeholder="E-Mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              disabled={status === "loading"}
            />
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium shadow-md transition-all hover:scale-[1.02]"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Wird gesendet..." : "Reset-Link senden"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-primary transition-colors"
          >
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  );
}
