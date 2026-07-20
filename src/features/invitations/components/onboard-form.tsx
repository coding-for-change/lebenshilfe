"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";

import { consumeUsedToken } from "@/features/invitations/actions";
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

export function OnboardForm({
  token,
  email,
  name: prefilledName,
}: {
  token: string;
  email: string;
  name: string | null;
}) {
  const router = useRouter();
  const hasPrefilledName = prefilledName != null;
  const [name, setName] = useState(prefilledName ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

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
      // better-auth returns errors as a plain { message, code } object (not an
      // Error), e.g. the haveIBeenPwned "Passwort taucht in Datenlecks auf"
      // message. Surface that message instead of a generic fallback.
      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error.message || "Fehler beim Registrieren.");
        return;
      }

      await consumeUsedToken(token);

      setStatus("success");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      // Reached only on an unexpected throw (e.g. network failure or
      // consumeUsedToken); better-auth field errors are handled above.
      logger.error(err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Fehler beim Registrieren.",
      );
    }
  }

  if (status === "success") {
    return (
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
    );
  }

  return (
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
              <FieldLabel htmlFor="email">E-Mail (verifiziert)</FieldLabel>
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
            {status === "error" && (
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
  );
}
