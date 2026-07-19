"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
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

export function TwoFactorVerify() {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const result =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code })
        : await authClient.twoFactor.verifyBackupCode({ code });

    if (result.error) {
      setErrorMsg(
        mode === "backup"
          ? "Dieser Wiederherstellungscode ist ungültig oder wurde bereits verwendet."
          : "Der Code ist ungültig oder abgelaufen. Bitte versuche es erneut.",
      );
      setStatus("error");
      return;
    }

    // Full session is now established — let the home route send admins to /admin.
    router.push("/");
    router.refresh();
  }

  function switchMode(next: "totp" | "backup") {
    setMode(next);
    setCode("");
    setStatus("idle");
    setErrorMsg("");
  }

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="gap-2 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Bestätigung in zwei Schritten
        </CardTitle>
        <CardDescription className="text-sm">
          {mode === "totp"
            ? "Gib den 6-stelligen Code aus deiner Authenticator-App ein."
            : "Gib einen deiner Wiederherstellungscodes ein."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-6">
            <Field>
              <FieldLabel htmlFor="code">
                {mode === "totp" ? "Code" : "Wiederherstellungscode"}
              </FieldLabel>
              <Input
                id="code"
                inputMode={mode === "totp" ? "numeric" : "text"}
                autoComplete="one-time-code"
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                disabled={status === "loading"}
                className="h-11 text-center tracking-widest"
                placeholder={mode === "totp" ? "123456" : "XXXXXXXXXX"}
                maxLength={mode === "totp" ? 6 : 20}
              />
            </Field>
            {status === "error" && (
              <p className="-mt-2 text-center text-sm text-destructive">
                {errorMsg}
              </p>
            )}
            <Field>
              <Button
                type="submit"
                className="h-11 w-full text-base font-medium"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Wird geprüft…" : "Bestätigen"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
        <button
          type="button"
          onClick={() => switchMode(mode === "totp" ? "backup" : "totp")}
          className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {mode === "totp"
            ? "Authenticator nicht zur Hand? Wiederherstellungscode verwenden"
            : "Zurück zum Authenticator-Code"}
        </button>
      </CardContent>
    </Card>
  );
}
