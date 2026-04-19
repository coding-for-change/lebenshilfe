"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    await requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    }).catch(() => {});

    setStatus("sent");
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/login.webp')" }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/30" />

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

        <Card className="border-border/60 shadow-xl">
          <CardHeader className="gap-2 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Passwort vergessen
            </CardTitle>
            <CardDescription className="text-sm">
              Gib deine E-Mail-Adresse ein und wir senden dir einen Reset-Link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "sent" ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/30">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Falls diese E-Mail-Adresse bei uns registriert ist, hast du
                    soeben einen Reset-Link erhalten.
                  </p>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Bitte überprüfe auch deinen Spam-Ordner.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-6">
                  <Field>
                    <FieldLabel htmlFor="email">E-Mail</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@lebenshilfe.de"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === "loading"}
                      className="h-11"
                    />
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      className="h-11 w-full text-base font-medium"
                      disabled={status === "loading"}
                    >
                      {status === "loading"
                        ? "Wird gesendet…"
                        : "Reset-Link senden"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/90 drop-shadow">
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-white"
          >
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  );
}
