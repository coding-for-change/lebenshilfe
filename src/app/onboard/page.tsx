"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckIcon } from "lucide-react";

import {
  fetchInviteDetails,
  consumeUsedToken,
} from "@/features/invitations/actions";
import { authClient } from "@/lib/auth-client";
import { logger } from "@/lib/logger";
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

export default function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const router = useRouter();
  const params = use(searchParams);
  const token = params.token;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [hasPrefilledName, setHasPrefilledName] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "verifying"
  >("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (token) {
      fetchInviteDetails(token)
        .then(({ email: resEmail, name: resName }) => {
          setEmail(resEmail);
          if (resName) {
            setName(resName);
            setHasPrefilledName(true);
          }
          setStatus("idle");
        })
        .catch(() => {
          setStatus("error");
          setErrorMessage("Der Link ist ungültig oder abgelaufen.");
        });
    } else {
      setStatus("error");
      setErrorMessage("Kein Einladungstoken gefunden.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    if (password.length < 12) {
      setStatus("error");
      setErrorMessage("Das Passwort muss mindestens 12 Zeichen lang sein.");
      return;
    }

    setStatus("loading");
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: name.trim(),
      });
      if (result.error) throw result.error;

      await consumeUsedToken(token as string);

      setStatus("success");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      logger.error(err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Fehler beim Registrieren.",
      );
    }
  }

  const linkInvalid =
    status === "error" &&
    (errorMessage.includes("abgelaufen") || errorMessage.includes("Kein"));

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

        {status === "verifying" ? (
          <Card className="border-border/60 shadow-xl">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Lade Einladung…
            </CardContent>
          </Card>
        ) : linkInvalid ? (
          <Card className="border-border/60 shadow-xl">
            <CardHeader className="gap-2 text-center">
              <CardTitle className="text-xl font-semibold text-destructive">
                Einladung ungültig
              </CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
          </Card>
        ) : status === "success" ? (
          <Card className="border-border/60 shadow-xl">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckIcon className="size-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-semibold">Profil erstellt</h1>
                <p className="text-sm text-muted-foreground">
                  Du wirst ins Dashboard weitergeleitet…
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60 shadow-xl">
            <CardHeader className="gap-2 text-center">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Willkommen
              </CardTitle>
              <CardDescription className="text-sm">
                Schließe deine Registrierung ab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-6">
                  <Field>
                    <FieldLabel htmlFor="email">
                      E-Mail (verifiziert)
                    </FieldLabel>
                    <Input
                      id="email"
                      disabled
                      value={email}
                      className="h-11 bg-muted/60"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      id="name"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={hasPrefilledName || status === "loading"}
                      className={hasPrefilledName ? "h-11 bg-muted/60" : "h-11"}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Passwort</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={12}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={status === "loading"}
                      className="h-11"
                    />
                  </Field>
                  {status === "error" && !linkInvalid && (
                    <p className="-mt-2 text-center text-sm text-destructive">
                      {errorMessage}
                    </p>
                  )}
                  <Field>
                    <Button
                      type="submit"
                      className="h-11 w-full text-base font-medium"
                      disabled={status === "loading"}
                    >
                      {status === "loading"
                        ? "Wird verarbeitet…"
                        : "Profil aktivieren"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
